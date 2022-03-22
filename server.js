const express = require('express');

const app = express();

const dataObjects = require('./info.js');

let elementsMetaData = {};

for (let i = 0; i < dataObjects.length; i++) {
    elementsMetaData[String(dataObjects[i].id)] = { indexInMainSequence: i, selected: false};
}

app.use(express.static("build")); //*
app.use(express.text());

app.post('/api/get-data', (req, res) => {
    const requestData = JSON.parse(req.body);
/*
    //Получится:
    requestData = {
        elementIds: [string]
    };
*/

    //Сильно упрощаем себе жизнь, считая, что dataObjects рассортирован по id, и что id - целые числа 0+.
    const respDataObjects = (requestData && requestData.elementIds && Array.isArray(requestData.elementIds)) ? requestData.elementIds.map((id) => dataObjects[id-1]) : []; 
    setTimeout(() => res.send(JSON.stringify(respDataObjects)), 1000);
});

app.get('/api/get-main-meta-data', (_, res) => {
    res.send(JSON.stringify(elementsMetaData));
});

app.post('/api/search', (req, res) => {
    const requestData = JSON.parse(req.body);
    const {strToSearch, alreadyLoadedIds} = requestData;
    const foundIds = dataObjects.filter((obj) => obj.body.toLowerCase().includes(String(strToSearch).toLowerCase().trim())).map((obj) => obj.id);

    let objectsToSend;
    if(alreadyLoadedIds && Array.isArray(alreadyLoadedIds)) {
        const unsentIds = foundIds.filter((id) => { //Находим id, чьи объекты ещё не были отправлены.
            return !alreadyLoadedIds.includes(id);
        });

        //Сильно упрощаем себе жизнь, считая, что dataObjects рассортирован по id, и что id - целые числа 0+.
        objectsToSend = unsentIds.map((id) => dataObjects[id-1]); //Формируем массив объектов, которые нужно отправить.
        
    }
    else objectsToSend = foundIds.map((id) => dataObjects[id-1]);
    
    const responseObject = {
        foundIds,
        newDataObjects: objectsToSend
    };

    setTimeout(() => res.send(JSON.stringify(responseObject)), 1000);
});

app.post('/api/save-sequence', (req, res) => { 
    const newElementsMetaData = JSON.parse(req.body);

    elementsMetaData = newElementsMetaData;
    
    res.send();
});

app.listen(3000, () => console.log("Server started at http://localhost:3000"));