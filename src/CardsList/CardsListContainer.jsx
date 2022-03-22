import { connect } from 'react-redux';
import {updateCardsSequenceInfo, fetchCardsByIds } from '../react-redux-store/cardsSlice';


import CardsList from './CardsList';

const mapStateToProps = state => {
    return {
        cards: state.cards,
        cardsSequenceInfo: state.cardsSequenceInfo,
        cardsProducedSequenceInfo: state.cardsProducedSequenceInfo,
        fetchCardsByIdsStatus: state.fetchCardsByIdsStatus
    };
};


const mapDispatchToProps = (dispatch) => {
    return {
        updateCardsSequenceInfo: newCardsSequence => dispatch(updateCardsSequenceInfo(newCardsSequence)),
        fetchCardsByIds: (ids) => dispatch(fetchCardsByIds(ids))
    };
};

const CardsListContainer = connect(mapStateToProps, mapDispatchToProps) (CardsList);

export default CardsListContainer;