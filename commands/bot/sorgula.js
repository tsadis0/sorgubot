const { SlashCommandBuilder,ActionRowBuilder,EmbedBuilder,ButtonBuilder,ButtonStyle } = require("discord.js");
const Discord = require("discord.js")
const crdb = require("croxydb")
const sqlite3 = require("sqlite3").verbose()
var letters = { "i": "İ", "ş": "Ş", "ğ": "Ğ", "ü": "Ü", "ö": "Ö", "ç": "Ç", "ı": "I" };

const moment = require("moment")
moment.locale("tr")
let db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the my database.');
});
var hasNumber = /\d/;  
module.exports = {
    command: {
        reqPermMember: "NONE",
        reqPermBot: "NONE"
        /* Yetki Gerekmiyorsa
        reqPermMember: "NONE",
        reqPermBot: "NONE"*/
    },
    data: new SlashCommandBuilder()
        .setName('sorgula')
        .setDescription("Ad Soyad sorgusu yapar.")
        .addStringOption(option => option.setName("isim").setDescription("Sorgulamak istediğiniz kişinin ismini girin.").setRequired(true))
        .addStringOption(option => option.setName("soyisim").setDescription("Sorgulamak istediğiniz kişinin soyismini girin.").setRequired(true)),
    async run(interaction) {
        let arr = []
        if(!interaction.channel.name.startsWith("sorgu")) return interaction.reply({ content:`Bu komutu sadece <#${interaction.guild.channels.cache.find(x => x.name == "sorgu")}> rolündekiler kullanabilir.`, ephemeral:true })
        if(crdb.get("status") && crdb.get("status") == "1") return interaction.reply({ content:`Bu servis şuanda meşgul.`, ephemeral:true })
        var ad = interaction.options.getString('isim')
        var soyad = interaction.options.getString('soyisim')
        if(ad.split(" ").length > 2 || soyad.split(" ").length > 1) return interaction.reply({ content:`Doğru biçimde ad, soyad girmelisiniz.`, ephemeral:true })
        if(hasNumber.test(ad) || hasNumber.test(soyad)) return interaction.reply({ content:"Doğru biçimde ad, soyad girmelisiniz.", ephemeral:true })
            interaction.reply({ content:"Lütfen bekleyiniz..." })
            crdb.set(`status`, "1")
        db.serialize(function () {
                db.all(`SELECT field2, field3, field4, field9, field7, field5, field6, field12, field13 FROM eski WHERE field3='${ad.toUpperCase().replace('Ğ','G').replace('Ü','U').replace('Ş','S').replace('I','I').replace('İ','I').replace('Ö','O').replace('Ç','C')}' AND field4='${soyad.toUpperCase().replace('Ğ','G').replace('Ü','U').replace('Ş','S').replace('I','I').replace('İ','I').replace('Ö','O').replace('Ç','C')}'`, (error, rows) => {
                 rows.forEach(row => arr.push(`TC: ${row.field2}, AD: ${row.field3}, SOYAD: ${row.field4}, DOĞUM TARİHİ: ${row.field9}, CİNSİYET: ${row.field7 == 'E' ? "Erkek" : "Kadın"}, ANNE ADI: ${row.field5}, BABA ADI: ${row.field6}, İL: ${row.field12}, İLÇE: ${row.field13}`))
               }).all(`SELECT * FROM yeni WHERE field3='${ad.replace(/(([iışğüçö]))/g, function(letter){ return letters[letter]; }).toUpperCase()}' AND field4='${soyad.replace(/(([iışğüçö]))/g, function(letter){ return letters[letter]; }).toUpperCase()}'`, (error2,rows2) => {
                 rows2.forEach(row => arr.push(`TC: ${row.field2}, AD: ${row.field3}, SOYAD: ${row.field4}, DOĞUM TARİHİ: ${row.field5}, CİNSİYET: ${row.field6}`))
                   	let attachment = new Discord.AttachmentBuilder(Buffer.from(new String(arr.join("\n")))).setName("sorgu.txt")
				   let embed = new EmbedBuilder()
                   .setAuthor({ name:"Sorgu Başarılı!", iconURL:interaction.user.avatarURL({ dynamic:true }) })
                   .setColor(0x0099FF)
                   .setDescription(`Sorgu yapılan isim: **\`${ad+" "+soyad}\`** \nSorgu tarihi: **${moment().format('D/M/YYYY, HH:mm')}** \nEşleşen sorgu sayısı: **\`${arr.length}\`**`)
                   .setFooter({ text:"Sorgu sona erdi", iconURL:interaction.guild.iconURL({ dynamic:true }) })
                    interaction.editReply({ content:`${interaction.user.toString()}`, embeds:[embed], files:[attachment] })
                    interaction.channel.send({ content:interaction.user.toString() }).then(xz => xz.delete())
	
                    crdb.set("status", "0")

                })
            })
    }
}
