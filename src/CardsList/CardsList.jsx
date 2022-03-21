import React, {useEffect, useState} from 'react';

import CardContainer from '../Card/CardContainer';
import {BROWSER_STORAGE_KEY} from '../auxiliary-js-modules/defaults';

import '../auxiliary-css/cross-modules-elements.css';
import './CardsList.css';

export default function CardsList({
    cards, 
    cardsSequenceInfo,
    cardsProducedSequenceInfo,
    fetchToExpandListStatus,
    updateAllInfoAboutSelectedCards, 
    updateCardsSequenceInfo, 
    useProducedCardsSequence, 
    length}) {
    const [draggingCardInfo, setDraggingCardInfo] = useState({cardId: null, cardIndexInSequence: null}); 

    const updateSessionStorage = (anyCardsSequenceInfo) => {//anyCardsSequenceInfo - объект вида {"идентификаторКарты-1": 0, "идентификаторКарты-2": 1, ...}
        const info = {};
        for (let id in anyCardsSequenceInfo) {
            info[id] = { indexInCardsSequence: anyCardsSequenceInfo[id], selected: cards[id] ? cards[id].selected : false};
        }
        sessionStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(info));
    };

    useEffect(() => {        
        if(!useProducedCardsSequence && (fetchToExpandListStatus===null || fetchToExpandListStatus==='fulfilled')) { //sessionStorage мы используем только при обычном просмотре карт, а не когда выводим какой-то специализированный набор (результат поиска или только выделенные карты). Кроме того, работать с sessionStorage можно только если не происходит никакой загрузки. 
            //console.log(length);
            if(Object.keys(cardsSequenceInfo).length!==0) {
                const objectFromStorage = sessionStorage.getItem(BROWSER_STORAGE_KEY) ? JSON.parse(sessionStorage.getItem(BROWSER_STORAGE_KEY)) : null;
                //Получим объект со св-вами вида "id": {indexInCardsSequence: number, selected:boolean}

                if(!objectFromStorage) { //sessionStorage пуст - сохраняем в нём текущую инфу о последовательности карт и их выделении.                    
                    updateSessionStorage(cardsSequenceInfo);
                }
                else {//В sessionStorage уже хранится какой-то порядок и выделение карт. Используем эту инфу.

                    const newCardsSequenceInfo = {};
                    const objsForAllInfoAboutSelectedCardsUpdate = [];
                    for (let id in objectFromStorage) {
                        newCardsSequenceInfo[id] = objectFromStorage[id].indexInCardsSequence;
                        objsForAllInfoAboutSelectedCardsUpdate.push({id, selected: objectFromStorage[id].selected});
                    }
                    updateAllInfoAboutSelectedCards(objsForAllInfoAboutSelectedCardsUpdate);
                    updateCardsSequenceInfo(newCardsSequenceInfo); 
                } 
            }
        }        
    }, [length, fetchToExpandListStatus]);    

    let cardComponents = [];
    if(!useProducedCardsSequence) {
        const cardDragStartHandler = (cardId, cardIndexInSequence) => {
            setDraggingCardInfo({cardId, cardIndexInSequence});
        };

        const cardDragEndHandler = () => {
            //Для случая, когда мы взяли карту, но сбросили её не на другую карту, а где-то в стороне. В этом случае событие drop не произойдёт, поэтому надо очистить draggingCardInfo здесь. Событие dragend происходит позже drop, так что не нужно опасаться, что мы потрём данные, которые нужны в обработчике drop.
            if(draggingCardInfo.cardId!==null) setDraggingCardInfo({cardId: null, cardIndexInSequence: null});
        };

        const cardDropHandler = (cardId, cardIndexInSequence) => {
            if(cardId!==draggingCardInfo.cardId) { //Перетаскиваемую карту можно сбросить на прежнее место. В этом случае, конечно, никаких изменений производить не нужно.
                let newCardsSequenceInfo = Object.assign({}, cardsSequenceInfo);
                newCardsSequenceInfo[cardId] = draggingCardInfo.cardIndexInSequence;
                newCardsSequenceInfo[draggingCardInfo.cardId] = cardIndexInSequence;
    
                updateSessionStorage(newCardsSequenceInfo);
                updateCardsSequenceInfo(newCardsSequenceInfo); 
            }
            setDraggingCardInfo({cardId: null, cardIndexInSequence: null});
        };     
        
        const cardDragHandlers = {
            cardDragStartHandler,
            cardDragEndHandler,
            cardDropHandler
        }; 

       
        const entries = Object.entries(cardsSequenceInfo).sort((entry1, entry2) => entry1[1] - entry2[1]); //[[id1, indexInMainCardsSequence1], [id2, indexInMainCardsSequence2], ...]
        cardComponents = (entries.length > 0) ? entries.map((entry, index) => { //После сортировки index должен совпадать с entry[1]
            const cardId = entry[0];
            const cardInfoObject = cards[cardId] ? cards[cardId] : {selected: false, content: null};
            return <CardContainer key={"card" + cardId} cardId={cardId} indexInMainSequence={index} cardInfoObject={cardInfoObject} draggable={true} {...cardDragHandlers}/>;
        }).slice(0, length) : null;
    }
    else {
        const entries = Object.entries(cardsProducedSequenceInfo).sort((entry1, entry2) => entry1[1] - entry2[1]); //[[id1, indexInMainCardsSequence1], [id2, indexInMainCardsSequence2], ...]
        cardComponents = (entries.length > 0) ? entries.map((entry) => { //А вот здесь index и entry[1] - разные вещи.
            const cardId = entry[0];
            const cardInfoObject = cards[cardId] ? cards[cardId] : {selected: false, content: null};
            return <CardContainer key={"card" + cardId} cardId={cardId} indexInMainSequence={entry[1]} cardInfoObject={cardInfoObject} draggable={false}/>;
        }).slice(0, length) : null;        
    }

    if(fetchToExpandListStatus==='rejected') 
        return (
            <span className='error-text'>Fetch error!</span>
        );
    else return (
        <>
            {cardComponents ? cardComponents : <span style={{color: "blue"}}>No cards found.</span>}
            {fetchToExpandListStatus==='pending' ? "Загрузка..." : false}
        </>
    );
}