import React, {useEffect, useState} from 'react';

import CardsList__CardContainer from './__Card/CardsList__CardContainer';

import '../auxiliary-css/cross-modules-elements.css';
import './CardsList.css';

export default function CardsList({
    cards, 
    cardsSequenceInfo,
    cardsProducedSequenceInfo,
    fetchCardsByIdsStatus,
    fetchCardsByIds,
    updateCardsSequenceInfo, 
    mode = "normal", 
    length}) {
    const [draggingCardInfo, setDraggingCardInfo] = useState({cardId: null, cardIndexInSequence: null}); 

    useEffect(() => {       
        let ids;
        if(mode==="normal") {
            const entries = Object.entries(cardsSequenceInfo).sort((entry1, entry2) => entry1[1].indexInMainSequence - entry2[1].indexInMainSequence); //[[id1, {indexInMainSequence: index1, selected: boolean}], ...]
            ids = entries.slice(0, length).map((entry) => entry[0]);
        }
        else {
            const entries = Object.entries(cardsProducedSequenceInfo).sort((entry1, entry2) => entry1[1].indexInProducedSequence - entry2[1].indexInProducedSequence); //[[id1, {indexInProducedSequence: ..}], ...]
            ids = entries.slice(0, length).map((entry) => entry[0]);
        }
        const idsToFetch = ids.filter((id) => { //Находим те id, чьи объекты не были загружены с сервера.
            if(cards[id]) return false;
            return true;
        });
        if(idsToFetch.length > 0) {
            const requestData = JSON.stringify({ elementIds: idsToFetch});
            fetchCardsByIds(requestData);
        }

    }, [mode, length]);


    let cardComponents = [];
    if(mode==="normal") {
        const cardDragStartHandler = (cardId, cardIndexInSequence) => {
            setDraggingCardInfo({cardId, cardIndexInSequence});
        };

        const cardDragEndHandler = () => {
            //Для случая, когда мы взяли карту, но сбросили её не на другую карту, а где-то в стороне. В этом случае событие drop не произойдёт, поэтому надо очистить draggingCardInfo здесь. Событие dragend происходит позже drop, так что не нужно опасаться, что мы потрём данные, которые нужны в обработчике drop.
            if(draggingCardInfo.cardId!==null) setDraggingCardInfo({cardId: null, cardIndexInSequence: null});
        };

        const cardDropHandler = (cardId, cardIndexInSequence) => {
            if(cardId!==draggingCardInfo.cardId) { //Перетаскиваемую карту можно сбросить на прежнее место. В этом случае, конечно, никаких изменений производить не нужно.
                let newCardsSequenceInfo = {};
                for (let id in cardsSequenceInfo) {
                    newCardsSequenceInfo[id] = Object.assign({}, cardsSequenceInfo[id]);
                }
                newCardsSequenceInfo[cardId].indexInMainSequence = draggingCardInfo.cardIndexInSequence;
                newCardsSequenceInfo[draggingCardInfo.cardId].indexInMainSequence = cardIndexInSequence;

                //updateSessionStorage(newCardsSequenceInfo);
                updateCardsSequenceInfo(newCardsSequenceInfo); 
            }
            setDraggingCardInfo({cardId: null, cardIndexInSequence: null});
        };     
        
        const cardDragHandlers = {
            cardDragStartHandler,
            cardDragEndHandler,
            cardDropHandler
        }; 

       
        const entries = Object.entries(cardsSequenceInfo).sort((entry1, entry2) => entry1[1].indexInMainSequence - entry2[1].indexInMainSequence).slice(0, length); //[[id1, {indexInMainSequence: index1, selected: boolean}], ...]
        cardComponents = (entries.length > 0) ? entries.map((entry, index) => {  //
            const cardId = entry[0];
            const selected = cardsSequenceInfo[cardId].selected;
            const cardInfoObject = cards[cardId] ? { selected, content: cards[cardId].content } : {selected: false, content: null};
            return <CardsList__CardContainer key={"card" + cardId} cardId={cardId} indexInMainSequence={entry[1].indexInMainSequence} cardInfoObject={cardInfoObject} draggable={true} {...cardDragHandlers}/>;
        }) : null;
    }
    else {
        const entries = Object.entries(cardsProducedSequenceInfo).sort((entry1, entry2) => entry1[1].indexInProducedSequence - entry2[1].indexInProducedSequence).slice(0, length); //[[id1, { indexInProducedSequence: ..}], ...]
        cardComponents = (entries.length > 0) ? entries.map((entry) => { 
            const cardId = entry[0];
            const selected = cardsSequenceInfo[cardId].selected;
            const indexInMainSequence = cardsSequenceInfo[cardId].indexInMainSequence;
            const cardInfoObject = cards[cardId] ? { selected, content: cards[cardId].content } : {selected: false, content: null};
            return <CardsList__CardContainer key={"card" + cardId} cardId={cardId} indexInMainSequence={indexInMainSequence} cardInfoObject={cardInfoObject} draggable={false}/>;
        }) : null;        
    }

    let cardsDataLoadingIndicator = null;
    if(fetchCardsByIdsStatus==='pending') cardsDataLoadingIndicator = <div className='some-process-indicator' style={{width: '300px'}}>Загрузка...</div>;

    if(fetchCardsByIdsStatus==='rejected') 
        return (
            <span className='error-text'>Fetch error!</span>
        );        
    else return (
        <>
            {(mode==="search_results") ? "Результаты поиска:" : false}
            {cardComponents ? cardComponents : <span style={{color: "blue"}}>No cards found.</span>}
            {cardsDataLoadingIndicator}
        </>
    );
}