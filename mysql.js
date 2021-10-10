//For interacting with a MySql DB

const Discord = require('discord.js');
var mysql = require('mysql');
const { Host, User, Password, Database } = require('./settings/settings.json');
const { currencyName } = require('./settings/config.json');
const Items = require('./settings/items.json');

//Create connection
var connection = mysql.createConnection({
	host: Host,
	user: User,
	password: Password,
	database: Database
});
  
//Attempt a connection
connection.connect(function(err) {
	if (err) throw err;
	console.log("Connected!");
});

//Get amount of currency
const getCurrency = (user, message) => {
	connection.query(`SELECT * FROM currency WHERE id = '${user.id}'`, (err, rows) => {
		if(err) throw err;
		if(user.bot) return;

		if(rows < 1)
		{
			const infoEmbed = new Discord.RichEmbed()
				.setColor('#0099ff')
				.setTitle(user.username)
				//.setURL(message.author.fetchProfile)
				.setDescription(`*Currently ${user.presence.status}*`)
				.setThumbnail(user.avatarURL)
				.addBlankField()
				.addField(currencyName, 0)
				//.addBlankField()
				.addField('Equipped Weapon', 'No equipped weapon')
				.addField('Equipped Weapon', 'No equipped clothing')
				//.setImage()
				.setTimestamp()
				.setFooter('A Discord Bot');

			message.channel.send(infoEmbed);

			return;
		}

		let amount = rows[0].amount;
		let sword = rows[0].equipped_weapon;
		let clothing = rows[0].equipped_clothing;

		const infoEmbed = new Discord.RichEmbed()
			.setColor('#0099ff')
			.setTitle(user.username)
			//.setURL(message.author.fetchProfile)
			.setDescription(`*Currently ${user.presence.status}*`)
			.setThumbnail(user.avatarURL)
			.addBlankField()
			.addField(currencyName, (amount == null) ? 0 : amount, true)
			//.addBlankField()
			.addField('Equipped Weapon', (rows[0].equipped_weapon == null ? 'No equipped weapon' : sword))
			.addField('Equipped Clothing', (rows[0].equipped_clothing == null ? 'No equipped clothing' : clothing))
			//.setImage()
			.setTimestamp()
			.setFooter('A Discord Bot');

		message.channel.send(infoEmbed);
	});
}

//Adding more currency to the db
const increaseCurrency = (did) => {

	//Get user from db
	connection.query(`SELECT * FROM currency WHERE id = '${did}'`, (err, rows) => {
		if(err) throw err;
		
		let sql;
		var newAmount = Math.floor(Math.random() * Math.floor(3));
		
		//User doesn't exist in db
		if(rows < 1)
			sql = `INSERT into currency (id, amount) VALUES ('${did}', ${newAmount})`;
		else { //Exists, just update them
			let amount = rows[0].amount;
			sql = `UPDATE currency SET amount = '${amount + newAmount}' WHERE id = '${did}'`;
        }
		
		//Do the thing
		connection.query(sql);
	});
}

const equipItem = (message, id, image, name, clothing) => {
	var failure;
	
	connection.query(`SELECT * FROM purchased_items WHERE id = '${message.author.id}' AND itemID = '${id}'`, (err, rows) => {
		if(err) throw err;

		if(rows < 1)
			message.channel.send("You do not own this item.");
		else
		{
			if(clothing)
				connection.query(`UPDATE currency SET equipped_clothing = '${name}' WHERE id = '${message.author.id}'`);
			else
				connection.query(`UPDATE currency SET equipped_weapon = '${name}' WHERE id = '${message.author.id}'`);
				
			//Send channel message
			const buyEmbed = new Discord.RichEmbed()
				.setColor('#D4AF37')
				.setTitle('Query Complete')
				//.setURL(message.author.fetchProfile)
				.setDescription(`${message.author.username} equipped **${name}**`)
				.setThumbnail(`${image}`)
				.addBlankField()
				.setTimestamp()
				.setFooter('A Discord Bot');
		
			message.channel.send(buyEmbed); 
		}
		
	});
}

//Buy an item
const buyItem = (message, id, price, image, arg) => {
	connection.query(`SELECT * FROM purchased_items WHERE id = '${message.author.id}' AND itemID = '${id}'`, (err, rows) => {
		if(err) throw err;

		let addItem;
		let chargeAmount;
		var failure = false;
		
		//Check funds
		connection.query(`SELECT amount FROM currency WHERE id = '${message.author.id}'`, (err, crows) => {
			if(err) throw err;
			
			if(crows < 1 || crows[0].amount < price)
				message.channel.send("Insufficient funds");
			else if(rows < 1) //Item not already owned
			{
				addItem = `INSERT into purchased_items (id, itemID) VALUES ('${message.author.id}', ${id})`;
				chargeAmount = `UPDATE currency SET amount = amount -'${price}' WHERE id = '${message.author.id}'`;
				
				//Update database
				connection.query(addItem);
				connection.query(chargeAmount);
				
				//Send channel message
				const buyEmbed = new Discord.RichEmbed()
					.setColor('#D4AF37')
					.setTitle('Transaction Complete')
					//.setURL(message.author.fetchProfile)
					.setDescription(`${message.author.username} purchased **${arg}**`)
					.setThumbnail(`${image}`)
					.addBlankField()
					.setTimestamp()
					.setFooter('A Discord Bot');
	
				message.channel.send(buyEmbed);  
			}
			else  //Exists, cancel transaction
				message.channel.send("You already purchased this item");
		});
	});
}

//debugSetCoins
const debugSetCoins = (message, amount) => {
	connection.query(`SELECT amount FROM currency WHERE id = '${message.author.id}'`, (err, rows) => {
		if(err) throw err;
		
		connection.query(`UPDATE currency SET amount = amount +'${amount}' WHERE id = '${message.author.id}'`);
	});
}

exports.increaseCurrency = increaseCurrency;
exports.getCurrency = getCurrency;
exports.buyItem = buyItem;
exports.equipItem = equipItem;
exports.debugSetCoins = debugSetCoins;
