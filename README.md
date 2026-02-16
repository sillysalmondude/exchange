# Installation Instructioons

git clone repo

cd exchange

npm install

nano .env # Edit the .env file

pm2 start npm --name "nextjs-app" -- start

cd examples/telegram

nano .env # Edit the .env file

pm2 start bot.js --name "Telegram Bot"

pm2 startup

pm2 save
