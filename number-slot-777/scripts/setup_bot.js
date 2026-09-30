const BOT_TOKEN = '8844960516:AAG8gcsv_WA9ORpk6xSfwB6qFrFJ2utWKDo';
const WEB_APP_URL = 'https://lucky-numbers-777.pages.dev';

async function request(method, body = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  console.log(`[${method}] Result:`, data);
  return data;
}

async function main() {
  console.log('--- Đang cấu hình Telegram Bot & Web App Menu Button ---');

  // 1. Kiểm tra thông tin bot
  await request('getMe');

  // 2. Cài đặt Menu Button (Nút "Chơi Ngay" ở góc dưới bên trái khung chat)
  await request('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '🎰 Chơi Ngay',
      web_app: {
        url: WEB_APP_URL
      }
    }
  });

  // 3. Cài đặt danh sách lệnh
  await request('setMyCommands', {
    commands: [
      { command: 'start', description: 'Bắt đầu và mở Game Mini App' },
      { command: 'play', description: 'Chơi Lucky Numbers 777 ngay' },
      { command: 'rules', description: 'Xem luật chơi & tỷ lệ trả thưởng' }
    ]
  });

  // 4. Cài đặt mô tả bot (Description)
  await request('setMyDescription', {
    description: '🎰 Chào mừng bạn đến với Lucky Numbers 777 - Slot Game 5x3 số học kết hợp cược đa dạng đầu tiên trên Telegram!\n\n✨ Tính năng nổi bật:\n- Dòng thưởng giữa Center Payline kịch tính\n- Cược số đơn (1-9) tỷ lệ x8\n- Cược Tài/Xỉu, Chẵn/Lẻ, Cặp số, Poker sảnh rồng\n- Tích hợp mượt mà Telegram Mini App với rung phản hồi Haptic Feedback!\n\n👇 Bấm nút "🎰 Chơi Ngay" hoặc gửi /play để bắt đầu quay!'
  });

  // 5. Cài đặt mô tả ngắn (Short description)
  await request('setMyShortDescription', {
    short_description: '🎰 Lucky Numbers 777 - Game Slot Số Độc Đáo Trên Telegram Mini App'
  });

  // 6. Cài đặt Webhook trỏ về Cloudflare Pages Serverless Function
  await request('setWebhook', {
    url: `${WEB_APP_URL}/api/telegram-webhook`
  });

  console.log('--- Hoàn tất cấu hình Bot Telegram! ---');
}

main().catch(err => console.error('Error:', err));
