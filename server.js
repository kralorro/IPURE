const express = require('express');
const bodyParser = require('body-parser');
const jsonexport = require('jsonexport');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// database connection
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

// configuration database
var pur_config = "pur_configuration";

// pur_config collections
var param_config  = "param_config";
var param_changes = "param_changes";

// parameter files databases
var pur_emm    = "pur_emm";
var pur_terra  = "pur_terra";


// response code mapping
const ADD_SUCCESS = '{"code":"10000", "message": "Parameter successfuly added"}';
const UPD_SUCCESS = '{"code":"10001", "message": "Parameter successfuly updated"}';
const DEL_SUCCESS = '{"code":"10002", "message": "Parameter successfuly deleted"}';
const ADD_FAILED  = '{"code":"90000", "message": "Failed to add parameter"}';
const UPD_FAILED  = '{"code":"90001", "message": "Failed to update parameter"}';
const DEL_FAILED  = '{"code":"90002", "message": "Failed to delete parameter"}';

const TRN_SUCCESS = '{"code":"10009", "message": "Transaction successful"}';
 
app.use("/static", express.static(path.join(__dirname, 'public')));

app.get('/', (request, response) => {
    message = '{"message": "Welcome to Parameter Update Request Integration Engine API gateway!"}';
    response.send(message);
});

app.get("/implementor", (req, res) => {
    res.sendFile(__dirname + "/implementor.html");
});

app.get("/requestor", (req, res) => {
    res.sendFile(__dirname + "/requestor.html"); 
});

function get_param_type(param_file){
    return 'file';
}

function is_valid_data(data, new_data){
    return true;
}

/****** for the requestor view ******/

app.get('/add_param', (request, response) => {
    var type = get_param_type(request.body.param_name);
    //var param_name = request.body.param_name;
    //var new_data = request.body.data;
    var param_name = request.query.param_name;
    var new_record = request.query.new_record;

    console.log(param_name);
    console.log(new_record);

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("add_param: Connection to Mongo database established... ");
        var dbo = db.db(pur_emm);
        var curr = param_name + '.current';
        dbo.collection(param_name).find({"param_name":curr}).toArray(function(err, result) {
            if (err) throw err;
            
            var myQuery = { "param_name": curr};
            var date = new Date().toISOString();
            var newValues = {$set: {"param_name": param_name + '.' + date}};
            
            new_param = curr;
            new_ext = result[0].ext;
            new_type = result[0].type;
            new_update_by = result[0].update_by;
            new_data = result[0].data;

            var newData = {"param_name":new_param, "ext":new_ext, "type":new_type, "update_by":new_update_by, "data":new_data};
            
            var obj = JSON.parse(JSON.stringify(newData));
            var body = JSON.parse(new_record);
            
            if (is_valid_data(obj['data'], body)){
                obj['data'].push(body);
                var jsonStr = obj;

                // console.log(jsonStr);
                // update the param_name.current record to param_name.<date>
                dbo.collection(param_name).updateOne(myQuery, newValues, function(err, res) {
                    if (err) throw err;
                    console.log("one document updated");
                    
                    // insert the new param_name.current record
                    dbo.collection(param_name).insertOne(jsonStr, function(err, res) {
                        if (err) throw err;
                        console.log("one document inserted");
                    });
                });

                // insert the new param_name.current record
                /*
                dbo.collection(param_name).insertOne(jsonStr, function(err, res) {
                    if (err) throw err;
                    console.log("one document inserted");
                });
                */
                db.close();

                // update param_changes to reflect in implementors view
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    if (type == 'file'){
                        data = {"param_name":param_name, "requested_by":"smart-user", "status":"pending", "date_update":date};
                        var dbo = db.db(pur_config);
                        dbo.collection(param_changes).insertOne(data, function(err, res) {
                            if (err) throw err;
                            db.close();
                            response.send(ADD_SUCCESS);
                        });
                    }
                });
            }

            else{
                response.send(ADD_FAILED);
            }           
        });
    });
});


app.post('/update_param', (request, response) => {
    response.send(UPD_SUCCESS)
});


app.get('/delete_param', (request, response) => {
    response.send(DEL_SUCCESS)
});

// get all the parameters
app.get('/get_params',(request, response) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("get_params: Connection to Mongo database established... ");
        var dbo = db.db(pur_config);
        dbo.collection(param_config).find({}).toArray(function(err, result) {
            if (err) throw err;
            response.send(result);
            db.close();
        });
    });
});


app.get('/get_param_struct',(request, response) => {
    var param_name = request.query.param_name;
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("get_param_struct: Connection to Mongo database established... ");
        var dbo = db.db(pur_config);
        dbo.collection(param_config).find({"param_name":param_name}).toArray(function(err, result) {
            if (err) throw err;
            response.send(result[0].structure);
            db.close();
        });
    });
});

// get the data of a given parameter file
app.get('/get_param_data',(request, response) => {
    var param_name = request.query.param_name;
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("get_param_data: Connection to Mongo database established... ");
        var dbo = db.db(pur_emm);
        var curr = param_name + '.current';
        dbo.collection(param_name).find({"param_name":curr}).toArray(function(err, result) {
            if (err) throw err;
            response.send(result);
            db.close();
        });
    });
});


app.get('/get_history',(request, response) => {
    var param_name = request.query.param_name;
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("get_history: Connection to Mongo database established... ");
        var dbo = db.db(pur_emm);
        var sort_by = { param_name: -1 };
        dbo.collection(param_name).find(
            {param_name: {"$regex":"^((?!current).)*$"}}, 
            { projection: { _id: 0, data: 0}}
        ).sort(sort_by).toArray(function(err, result) {
            if (err) throw err;
            response.send(result);
            db.close();
        });
    });
});


/****** for the implementor view ******/

app.get('/get_changes',(request, response) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("get_changes: Connection to Mongo database established... ");
        var dbo = db.db(pur_config);
        dbo.collection(param_changes).find({"status":"pending"}).toArray(function(err, result) {
            if (err) throw err;
            response.send(result);
            db.close();
        });
    });
});


app.get('/download_param',(request, response) => {
    var param_name = request.query.param_name;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;

        console.log("download_param: Connection to Mongo database established... ");
        var dbo = db.db(pur_emm);
        var curr = param_name + '.current';
        dbo.collection(param_name).find({"param_name":curr}).toArray(function(err, result) {
            if (err) throw err;
            res  = result[0].data;
            ext  = result[0].ext;
            type = result[0].type;
            db.close();
            
            if (type == 'db'){
                // extract the SQL script from the changes database        
            }
            else{
                jsonexport(res, {rowDelimiter: ';', 'includeHeaders':false}, function(err, csv){
                    if(err) return console.log(err);

                    var file = __dirname + '/' + param_name + '.' + ext; 
                    fs.writeFile(file, csv, 'utf8', function (err) {
                        if (err) {
                            console.log("An error occured while writing JSON Object to file.");
                            return console.log(err);
                        }
                    
                        console.log("JSON file has been saved."); 
                        console.log("Downloading parameter file ...");  
                        response.download(file);             
                    });
                });
            }
        });
    });
});


app.get('/tag_as_implemented',(request, response) => {
    var param_name = request.query.param_name;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        console.log("tag_as_implemented: Connection to Mongo database established... ");
        var dbo = db.db(pur_config);

        var myquery = { "param_name": param_name, "status": "pending"};
        var newvalues = {$set: {"status": "implemented"}};

        dbo.collection(param_changes).updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("one document updated");
            db.close();
        });
    });
});


// listen to the App Engine-specified port, or 8080 otherwise
const port = process.env.PORT || 8080;
const host_name = '10.31.80.224';
app.listen(port, () => {
    console.log("server listening on port 8080");
});