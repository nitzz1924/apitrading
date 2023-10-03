
app = require('../server/server');
loopback = require("loopback")
var loconavService = app.dataSources.loconavService;
var MtDeviceData = loopback.getModel("MtDeviceData")
loconavService.findAllDevices(function (err, response, context) {
    if (err) throw err; //error making request
    if (response.error) {
        next('> response error: ' + response.error.stack);
    }
    // console.log(JSON.stringify(response));
    var responseData=[];
    response.forEach(_r => {
        r={};
        r=_r.data;
        r.createdAt=new Date();
        responseData.push(r);
    });
    MtDeviceData.create(responseData,(err,data)=>{
        console.error(err)
    });
    //verify via `curl localhost:3000/api/Magazines`

});
