const result = await db.collection('animals').where({
  _openid: openid
}).get(); 