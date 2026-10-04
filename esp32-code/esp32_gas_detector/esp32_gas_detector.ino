#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

#define MQ2_PIN 34
#define BUZZER 25
#define RELAY_FAN 26  // Chân 26 là Quạt (Relay)
#define SERVO_PIN 18  // Chân 18 là Van (Servo)

// Thông tin mạng WiFi

const char* ssid = "H";
const char* password = "88888888";

// const char* ssid = "Nha Tro Phuc An 3_5";
// const char* password = "25041992";
// URL API MÁY CHỦ CLOUD (RENDER)
const char* serverNamePost = "https://gas-station-project.onrender.com/api/esp/update";
const char* serverNameGet = "https://gas-station-project.onrender.com/api/status";

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo myServo;

unsigned long lastTime = 0;
unsigned long timerDelay = 2000;

int baseAdc = 0; // Biến lưu giá trị mặc định của cảm biến trong không khí sạch

// Biến lưu trạng thái từ Web Dashboard
bool manualBuzzerMuted = false; // Mặc định KHÔNG tắt còi khi báo động
bool manualValveOpen = true;    // Mặc định mở van khi an toàn
bool manualFanOn = true;        // Mặc định cho phép quạt chạy khi báo động

bool isDangerMode = false;

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);

  digitalWrite(BUZZER, LOW);      // Ban đầu tắt còi
  digitalWrite(RELAY_FAN, HIGH);  // Ban đầu tắt quạt (Relay kích mức LOW)

  myServo.attach(SERVO_PIN);

  // Khởi động mặc định mở van
  myServo.write(90);  // 90 độ là góc MỞ VAN

  Wire.begin(21, 22);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Gas Detector");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(1500);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempts % 16, 1);
    lcd.print(".");
    attempts++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
  } else {
    Serial.println("\nWiFi Failed!");
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Running Offline");
  }
  delay(2000);

  // Hiệu chuẩn cảm biến để lấy mốc 0 trong không khí sạch
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrating MQ2");
  long sumCalib = 0;
  for (int i = 0; i < 50; i++) {
    sumCalib += analogRead(MQ2_PIN);
    delay(20);
  }
  baseAdc = sumCalib / 50;
  
  lcd.clear();
}

void loop() {
  // Lọc nhiễu: Đọc cảm biến 10 lần và lấy trung bình để tránh tình trạng nhảy số liên tục
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MQ2_PIN);
    delay(5);
  }
  int adcValue = sum / 10;

  // --- CHẨN ĐOÁN LỖI PHẦN CỨNG (Hư cảm biến, đứt dây, lỏng nguồn) ---
  // Cảm biến MQ-2 bình thường luôn duy trì một mức điện áp nền.
  // Nếu tín hiệu ADC rớt xuống dưới 50, chắc chắn 100% cảm biến đã bị đứt dây A0 hoặc mất nguồn lõi nhiệt.
  if (adcValue < 50) {
    lcd.setCursor(0, 0);
    lcd.print("SENSOR ERROR!   ");
    lcd.setCursor(0, 1);
    lcd.print("Check Wiring... ");
    delay(2000);
    return; // Dừng chạy phần báo động bên dưới, tránh báo động giả
  }
  
  // Trừ đi điện áp nền để bắt đầu từ 0
  int realAdc = adcValue - baseAdc;
  if (realAdc < 0) realAdc = 0; // Không cho số âm
  
  int ppmValue = map(realAdc, 0, 4095 - baseAdc, 0, 10000);

  // Khử nhiễu dư âm (Deadzone): 
  // Hạ xuống mức 50 để vẫn phát hiện được rò rỉ nhẹ, 
  // đổi lại khi test xong bạn phải chờ vài phút để số từ từ hạ hẳn về 0.
  if (ppmValue < 50) {
    ppmValue = 0;
  }

  lcd.setCursor(0, 0);
  lcd.print("Gas: ");
  lcd.print(ppmValue);
  lcd.print(" PPM   ");

  // --- CẬP NHẬT NGƯỠNG NGUY HIỂM (600 PPM) ---
  if (ppmValue >= 600) {
    isDangerMode = true;
  } else if (ppmValue < 500) {
    isDangerMode = false;
  }

  // --- 1. VAN KHÓA GAS ---
  if (isDangerMode) {
    myServo.write(0);  // 0 ĐỘ = ĐÓNG VAN KHẨN CẤP (Bảo vệ an toàn dù có mạng hay không)
  } else {
    if (manualValveOpen) {
      myServo.write(90);  // 90 ĐỘ = MỞ VAN (Khi an toàn)
    } else {
      myServo.write(0);   // ĐÓNG VAN (Theo lệnh từ Dashboard)
    }
  }

  // --- 2. QUẠT HÚT KHÍ (Relay kích mức LOW = BẬT) ---
  if (isDangerMode) {
    // Khi NGUY HIỂM: Luôn BẬT quạt hút khí gas khẩn cấp
    // Chỉ tắt nếu nhận lệnh chủ động tắt từ Dashboard
    if (manualFanOn == false) {
      digitalWrite(RELAY_FAN, HIGH); // Nhận lệnh tắt cưỡng bức từ web
    } else {
      digitalWrite(RELAY_FAN, LOW);  // TỰ ĐỘNG BẬT QUẠT HÚT KHÍ GAS
    }
  } else {
    // Chế độ AN TOÀN: Bật/tắt theo điều khiển Dashboard
    if (manualFanOn) {
      digitalWrite(RELAY_FAN, LOW);
    } else {
      digitalWrite(RELAY_FAN, HIGH);
    }
  }

  // --- 3. CÒI BÁO ĐỘNG (BUZZER: HIGH = KÊU, LOW = TẮT) ---
  if (isDangerMode) {
    // Khi NGUY HIỂM: Luôn HÚ CÒI báo động
    // Chỉ tắt tiếng nếu người dùng bấm nút tắt chuông (Mute) từ Dashboard
    if (manualBuzzerMuted == true) {
      digitalWrite(BUZZER, LOW);  // Tạm tắt tiếng chuông từ web
    } else {
      digitalWrite(BUZZER, HIGH); // TỰ ĐỘNG HÚ CÒI BÁO ĐỘNG
    }
  } else {
    // Chế độ AN TOÀN: Tắt còi
    digitalWrite(BUZZER, LOW);
  }

  // --- 4. MÀN HÌNH LCD ---
  if (isDangerMode) {
    lcd.setCursor(0, 1);
    lcd.print("GAS ALERT!     ");
  } else {
    lcd.setCursor(0, 1);
    lcd.print("SAFE           ");
  }

  // =========================================================================
  // [PHẦN 2] GIAO TIẾP MÁY CHỦ (PHẦN BỊ BẠN XÓA MẤT)
  // BẮT BUỘC PHẢI GIỮ LẠI ĐỂ DASHBOARD NHẬN ĐƯỢC DATA
  // =========================================================================
  if ((millis() - lastTime) > timerDelay) {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure(); // Rất quan trọng khi gửi request HTTPS lên Vercel
      HTTPClient http;

      // Vừa Gửi nồng độ lên, vừa Nhận luôn lệnh từ Server trả về qua POST
      http.begin(client, serverNamePost);
      http.addHeader("Content-Type", "application/json");
      String httpRequestData = "{\"ppm\":" + String(ppmValue) + "}";

      int httpResponseCode = http.POST(httpRequestData);

      if (httpResponseCode > 0) {
        String payload = http.getString();

        // Vì gói tin POST trả về rất nhẹ (không chứa biểu đồ), 512 byte là đủ
        DynamicJsonDocument doc(512);
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          manualBuzzerMuted = doc["isBuzzerMuted"];
          manualValveOpen = doc["isOpen"];
          manualFanOn = doc["isOn"];
        } else {
          Serial.println("Lỗi phân tích JSON: Bị tràn bộ nhớ hoặc sai định dạng");
        }
      } else {
        Serial.print("Lỗi POST HTTP: ");
        Serial.println(httpResponseCode);
      }
      http.end();
    }
    lastTime = millis();  
  }

  delay(100);
}
