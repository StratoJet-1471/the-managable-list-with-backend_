import React, {useState} from 'react';

import './CardsList__Card.css';

export default function Card(props) {
    const {
        selectCard, 
        deselectCard, 
        cardId, 
        indexInMainSequence,
        draggable,
        cardInfoObject: {
            selected, 
            content
        }
    } = props;

    const [additionalClassName, setAdditionalClassName] = useState('');

    const cardClass = selected ? 'card card_selected' : 'card';

    const checkBoxChangeHandler = () => {
        if(selected) deselectCard(cardId);
        else selectCard(cardId);         
    }

    if(draggable) {
        const {cardDragStartHandler, cardDragEndHandler, cardDropHandler} = props;

        const onDragStart = () => {
            cardDragStartHandler(cardId, indexInMainSequence); //Вызывается у карты, когда её "хватают" мышью
        };
    
        const onDragOver = (e) => {//Вызывается у карты, над которой находится курсор, перетаскивающий другую карту.
            e.preventDefault(); 
        };
    
        const onDragEnter = () => { //Вызывается у карты, над которой проносят перетаскиваемую, в момент, когда курсор оказывается в её пределах.
            setAdditionalClassName(' card_drag-over');
        };
    
        const onDragLeave = () => {//Вызывается у карты, над которой проносят перетаскиваемую, когда курсор покидает её пределы (т.е., перетаскивающий курсор на неё зашёл, а теперь уходит).
            setAdditionalClassName('');
        };
    
        const onDragEnd = () => {//Вызывается у перетаскиваемой карты, когда её "сбрасывают".
            cardDragEndHandler();
        };
    
        const onDrop = (e) => {//Вызывается у карты, на которую "сбросили" перетаскиваемую карту (курсор должен находиться над картой - если он будет вне её, событие не произойдёт).
            e.preventDefault();
            setAdditionalClassName('');
            cardDropHandler(cardId, indexInMainSequence);     
        };
    
        const propsForDragging = {
            draggable: true,
            onDragStart, 
            onDragEnter,
            onDragLeave, 
            onDragEnd, 
            onDragOver, 
            onDrop
        };

        return (
            <div className={cardClass + additionalClassName} {...propsForDragging}>
                <span className='card__title'>Card {cardId}:</span>
                <span>{content}</span>
                <input type="checkbox" checked={selected} onChange={checkBoxChangeHandler}/>
            </div>
        );
    }
    else {
        return (
            <div className={cardClass + additionalClassName + ' card_not-draggable'}>
                <span className='card__title'>Card {cardId}:</span>
                <span>{content}</span>
                <input type="checkbox" checked={selected} onChange={checkBoxChangeHandler}/>
            </div>
        );
    }
}