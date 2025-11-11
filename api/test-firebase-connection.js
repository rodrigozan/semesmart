import fs from "fs";
import admin from "firebase-admin";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

(async () => {
  const doc = await db.collection("test").add({ msg: "Conexão ok!" });
  console.log("✅ Documento criado com ID:", doc.id);
})();
