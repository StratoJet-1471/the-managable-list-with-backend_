import { connect } from 'react-redux';
import {updateAllInfoAboutSelectedCards, updateCardsSequenceInfo } from '../react-redux-store/cardsSlice';


import CardsList from './CardsList';

const mapStateToProps = state => {
    return {
        cards: state.cards,
        cardsSequenceInfo: state.cardsSequenceInfo,
        cardsProducedSequenceInfo: state.cardsProducedSequenceInfo,
        fetchToExpandListStatus: state.fetchToExpandListStatus
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        updateAllInfoAboutSelectedCards: infoObjects => dispatch(updateAllInfoAboutSelectedCards(infoObjects)),
        updateCardsSequenceInfo: newCardsSequence => dispatch(updateCardsSequenceInfo(newCardsSequence))
    };
};

const CardsListContainer = connect(mapStateToProps, mapDispatchToProps) (CardsList);

export default CardsListContainer;