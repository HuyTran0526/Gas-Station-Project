// Dịch vụ tích hợp Google Analytics 4 (GA4) và đo lường sự kiện

export const initGA4 = (measurementId) => {
  if (!measurementId || measurementId.includes('XXXXX') || typeof window === 'undefined') {
    return;
  }

  // Đảm bảo không nạp lặp lại
  if (window.gtagInitialized) return;

  // 1. Chèn script Google Tag gtag.js vào thẻ <head>
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  // 2. Khởi tạo dataLayer & hàm gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());

  // Tự động phân tích UTM parameters từ URL hiện tại
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || urlParams.get('ref');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');

  gtag('config', measurementId, {
    send_page_view: true,
    campaign_source: utmSource || undefined,
    campaign_medium: utmMedium || undefined,
    campaign_name: utmCampaign || undefined
  });

  window.gtagInitialized = true;
  console.log('📊 Google Analytics 4 (GA4) đã kích hoạt thành công với ID:', measurementId);
};

// Gửi sự kiện tùy biến (Custom Events) lên GA4
export const trackGAEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};
