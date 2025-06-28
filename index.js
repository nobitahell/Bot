const { Client, GatewayIntentBits, Partials } = require('discord.js');
const db = require('quick.db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Put your bot token here
const TOKEN = '';

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  // !balance
  if (cmd === 'balance' || cmd === 'bal') {
    const user = message.mentions.users.first() || message.author;
    const balance = db.get(`balance_${user.id}`) || 0;
    return message.reply(`💰 **${user.username}** has **${balance} coins**.`);
  }

  // !daily
  if (cmd === 'daily') {
    const timeout = 24 * 60 * 60 * 1000; // 24 hours
    const lastDaily = db.get(`lastDaily_${message.author.id}`);

    if (lastDaily !== null && timeout - (Date.now() - lastDaily) > 0) {
      const timeLeft = timeout - (Date.now() - lastDaily);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      return message.reply(`⏳ You already claimed your daily. Try again in **${hours}h ${minutes}m**.`);
    } else {
      const reward = Math.floor(Math.random() * 100) + 50; // 50–149 coins
      db.add(`balance_${message.author.id}`, reward);
      db.set(`lastDaily_${message.author.id}`, Date.now());
      return message.reply(`🎁 You claimed your daily reward and earned **${reward} coins!**`);
    }
  }

  // !give @user amount
  if (cmd === 'give') {
    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || user.bot || isNaN(amount) || amount <= 0) {
      return message.reply(`❌ Usage: \`!give @user amount\``);
    }

    const senderBalance = db.get(`balance_${message.author.id}`) || 0;
    if (senderBalance < amount) {
      return message.reply(`❌ You don't have enough coins.`);
    }

    db.subtract(`balance_${message.author.id}`, amount);
    db.add(`balance_${user.id}`, amount);
    return message.reply(`✅ You sent **${amount} coins** to **${user.username}**.`);
  }

  // !work
  if (cmd === 'work') {
    const timeout = 15 * 1000; // 15 sec cooldown
    const lastWork = db.get(`lastWork_${message.author.id}`);

    if (lastWork !== null && timeout - (Date.now() - lastWork) > 0) {
      const timeLeft = Math.ceil((timeout - (Date.now() - lastWork)) / 1000);
      return message.reply(`⏳ You are tired! Wait **${timeLeft}s** before working again.`);
    }

    // Activities and loot tables
    const activities = [
      {
        name: 'mining',
        loot: [
          { name: 'Silver', weight: 40, value: 500 },
          { name: 'Gold', weight: 25, value: 1000 },
          { name: 'Diamond', weight: 15, value: 2500 },
          { name: 'Ruby', weight: 10, value: 5000 },
          { name: 'Red Diamond', weight: 6, value: 10000 },
          { name: 'Black Diamond', weight: 4, value: 25000 }
        ]
      },
      {
        name: 'fishing',
        loot: [
          { name: 'Small Fish', weight: 40, value: 300 },
          { name: 'Big Fish', weight: 25, value: 700 },
          { name: 'Rare Koi', weight: 15, value: 1500 },
          { name: 'Golden Fish', weight: 10, value: 4000 },
          { name: 'Ancient Fish', weight: 6, value: 8000 },
          { name: 'Mythical Leviathan', weight: 4, value: 20000 }
        ]
      },
      {
        name: 'farming',
        loot: [
          { name: 'Carrot Basket', weight: 40, value: 250 },
          { name: 'Tomato Crate', weight: 25, value: 600 },
          { name: 'Golden Apple', weight: 15, value: 2000 },
          { name: 'Magic Pumpkin', weight: 10, value: 5000 },
          { name: 'Rainbow Corn', weight: 6, value: 9000 },
          { name: 'Enchanted Seed', weight: 4, value: 22000 }
        ]
      },
      {
        name: 'hunting',
        loot: [
          { name: 'Rabbit', weight: 40, value: 400 },
          { name: 'Deer', weight: 25, value: 800 },
          { name: 'Boar', weight: 15, value: 2200 },
          { name: 'White Stag', weight: 10, value: 5500 },
          { name: 'Spirit Wolf', weight: 6, value: 11000 },
          { name: 'Golden Griffin', weight: 4, value: 27000 }
        ]
      },
      {
        name: 'cooking',
        loot: [
          { name: 'Bread Loaf', weight: 40, value: 350 },
          { name: 'Cheese Wheel', weight: 25, value: 750 },
          { name: 'Gourmet Stew', weight: 15, value: 1800 },
          { name: 'Royal Cake', weight: 10, value: 4800 },
          { name: 'Phoenix Egg Omelette', weight: 6, value: 12000 },
          { name: 'Divine Feast', weight: 4, value: 30000 }
        ]
      }
    ];

    // Random activity
    const activity = activities[Math.floor(Math.random() * activities.length)];

    // Weighted loot selection
    const totalWeight = activity.loot.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedLoot;

    for (const item of activity.loot) {
      if (random < item.weight) {
        selectedLoot = item;
        break;
      }
      random -= item.weight;
    }

    db.set(`lastWork_${message.author.id}`, Date.now());
    db.add(`balance_${message.author.id}`, selectedLoot.value);

    return message.reply(`✨ You went **${activity.name}** and obtained **${selectedLoot.name}** worth **${selectedLoot.value} coins!**`);
  }
});

client.login(TOKEN);
        
