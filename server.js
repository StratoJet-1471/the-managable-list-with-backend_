const express = require('express');

const app = express();

const infoObjects = require('./info.js');

const defaultInfoObjectsNInChunk = 20;
let sentIds = new Set(); //Сюда записываются id отправленных клиенту объектов.

let elementsSequenceInfo = {};

for (let i = 0; i < infoObjects.length; i++) {
    elementsSequenceInfo[String(infoObjects[i].id)] = i;
}

app.use(express.static("build")); //*

app.use('/api/get-initial-data', express.text());
app.post('/api/get-initial-data', (req, res) => {
    const metaData = JSON.parse(req.body);
    const elementsN = (metaData && metaData.elementsN) ? metaData.elementsN : defaultInfoObjectsNInChunk;
    const allIds = infoObjects.map((infoObject) => infoObject.id);

    const reqInfoObjects = infoObjects.slice(0, elementsN);    
    const responseObject = {
        allIds,
        infoObjects: reqInfoObjects
    };

    sentIds.clear();
    for (let obj of reqInfoObjects) { sentIds.add(obj.id); }

    res.send(JSON.stringify(responseObject));
});

app.use('/api/get-extended-data', express.text());
app.post('/api/get-extended-data', (req, res) => {
    const metaData = JSON.parse(req.body);
    //Сильно упрощаем себе жизнь, считая, что infoObjects рассортирован по id, и что id - целые числа 0+.
    const responseObjsArray = metaData.elementIds.map((id) => infoObjects[id-1]);
    for (let obj of responseObjsArray) { sentIds.add(obj.id); }

    res.send(JSON.stringify(responseObjsArray));
});

app.use('/api/search', express.text());
app.post('/api/search', (req, res) => {
    const metaData = JSON.parse(req.body);
    const searchStr = metaData.strToSearch;
    const foundIds = infoObjects.filter((obj) => obj.body.toLowerCase().includes(searchStr.toLowerCase().trim())).map((obj) => obj.id);
    //Сильно упрощаем себе жизнь, считая, что infoObjects рассортирован по id, и что id - целые числа 0+.
    const objectsToSend = foundIds.filter((id) => !sentIds.has(id)).map((id) => infoObjects[id-1]);
    const responseObject = {
        foundIds,
        previouslyUnsentInfoObjects: objectsToSend
    };

    for (let obj of objectsToSend) { sentIds.add(obj.id); }

    res.send(JSON.stringify(responseObject));
});

app.use('/api/save-sequence', express.text());
app.post('/api/save-sequence', (req, res) => { 
    const newElementsSequenceInfo = JSON.parse(req.body);

    elementsSequenceInfo = newElementsSequenceInfo;
    
    res.send();
});

app.use('/api/load-sequence', express.text());
app.get('/api/load-sequence', (_, res) => { 
    res.send(JSON.stringify(elementsSequenceInfo));
});

//Если задано (*) выше, то он сюда вообще не попадёт.
app.get('/*', (_, res) => {
    const options = {root: "./"};
    res.sendFile('build/index.html', options, (err) => {
        if(err) res.status(404).send();
    });
});

app.listen(3000, () => console.log("Server started at http://localhost:3000"));