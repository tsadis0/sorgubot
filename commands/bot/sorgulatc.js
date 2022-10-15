const { SlashCommandBuilder,ActionRowBuilder,EmbedBuilder,ButtonBuilder,ButtonStyle } = require("discord.js");
const puppeteer = require("puppeteer")

module.exports = {
    command: {
        reqPermMember: "NONE",
        reqPermBot: "NONE"
        /* Yetki Gerekmiyorsa
        reqPermMember: "NONE",
        reqPermBot: "NONE"*/
    },
    data: new SlashCommandBuilder()
        .setName('sorgulatc')
        .setDescription("TC sorgusu yapar.")
        .addNumberOption(option => option.setName("tckn").setDescription("Sorgulamak istediğiniz kişinin tc kimlik numarasını girin.").setRequired(true))
        .addStringOption(option => option.setName("dogum").setDescription("Sorgulamak istediğiniz kişinin doğum tarihini girin.").setRequired(true)),
    async run(interaction) {
        if(interaction.channel.name != "sorgu") return interaction.reply({ content:"Bu komutu sadece <#"+ interaction.guild.channels.cache.find(x => x.name == "sorgu").id+"> kanalında kullanabilirsin.", ephemeral:true })
        if(interaction.options.getString("dogum").length != 10) return interaction.reply({ content:"Lütfen doğum tarihini şu şekilde giriniz: 01.01.1970", ephemeral:true })
        if(interaction.options.getNumber("tckn").toString().length != 11) return interaction.reply({ content:"Lütfen doğru bir TCKN giriniz.", ephemeral:true })
        let birthday = interaction.options.getString("dogum")
        let tckn = interaction.options.getNumber("tckn").toString()
        interaction.reply({ content:"Lütfen bekleyiniz..." })
     const browser = await puppeteer.launch({ 
        headless:true,
        devtools:true,
        args:['--ignore-certificate-errors']
      });
      const page = await browser.newPage();
      await page.goto('https://enstitubasvuru.yyu.edu.tr/register');
      await page.setViewport({ width:1200, height:800 })
       await page.evaluate((tckn) => {
        const input = document.querySelector('input[name="identity_number"]');
        input.value = tckn;
      },tckn);
      await page.evaluate((birthday) => {
        const input = document.querySelector('input[name="birth_date"]');
        input.value = birthday;
      },birthday);
      await page.click("[onclick='KimlikBilgileriGetir\(\)']")
      page.on("response", async (response) => {
        if(response.url().endsWith("/gii")){
          if(!await response.headers()["set-cookie"] || await response.headers()["set-cookie"] == undefined) return interaction.editReply({ content: "Veri bulunamadı." })
          let ata = await response.json()
          let embed = new EmbedBuilder()
          .setAuthor({ name: "Tsadis sorgu sistemi", iconURL:interaction.guild.iconURL({ dynamic:true}) })
          .setDescription(`\`Ad\`: **${ata.name}** \n\`Soyad\`: **${ata.surname}** \n\`Cinsiyet\`: **${ata.gender.replace("906001", "Erkek").replace("906002", "Kadın")}** \n\`Babası\`: **${ata.fathers_name}** \n\`Annesi\`: **${ata.mothers_name}** \n\`Doğum yeri\`: **${ata.birth_place}** \n\`Doğum tarihi\`: **${ata.birth_date}** \n\`Seri numarası\`: **${ata.serial_no}** \n\`Cilt No\`: **${ata.volume_no}** \n\`Aile Sıra No\`: **${ata.family_order_no}** \n\`Sıra No\`: **${ata.order_number}** \n\`Nüfus İlçe\`: **${ata.place_where_given}** \n\`Nüfus Mahalle\`: **${ata.village}**`)
          .setFooter({ text:`${interaction.user.tag} tarafından istendi`, iconURL:interaction.user.avatarURL({ dynamic:true }) })
          .setColor("Gold")
          .setThumbnail("https://i.gifer.com/embedded/download/3U7X.gif")
          .setTimestamp()
          interaction.editReply({ content:interaction.user.toString(), embeds:[embed] })
        }
      })
    }
}
