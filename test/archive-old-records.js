db = db.getMongo().getDB("moverstrip");
_30daysBack=parseInt(new Date().getTime()/1000)-(90*24*60*60);
db.getCollection('MtDeviceData').find({last_received_at:{$lt:_30daysBack}}).forEach(record => {
    db.getCollection('MtDeviceDataArchive').insert(record);
    db.getCollection('MtDeviceData').remove({_id:record._id});

});