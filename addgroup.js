const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
 
// const myGroupName = "Wali murid 86 lama";
const myGroupName = "test";
const contactName = "Hasan 2";
 
const client = new Client({
  authStrategy: new LocalAuth(),
});
 
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});
 
client.on("ready", () => {
  console.log("Client is ready!");
  client.getChats().then((chats) => {
    const myGroup = chats.find((chat) => chat.name === myGroupName);
    myGroup.addParticipants(["6289643088436@c.us"]);
    client.getContacts().then((contacts) => {
      const contactToAdd = contacts.find(
        // Finding the contact Id using the contact's name
        (contact) => contact.name === contactName
      );
      if (contactToAdd) {
        myGroup
          .addParticipants([contactToAdd.id._serialized]) // Pass an array of contact IDs [id1, id2, id3 .....]
          .then(() =>
            console.log(
              `Successfully added ${contactName} to the group ${myGroupName}`
            )
          );
      } else {
        console.log("Contact not found");
      }
    });
  });
});
 
client.initialize();