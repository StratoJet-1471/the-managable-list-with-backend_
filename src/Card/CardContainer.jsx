import { connect } from 'react-redux';
import { selectCard, deselectCard } from '../react-redux-store/cardsSlice';

import Card from './Card';

const mapDispatchToProps = (dispatch) => {
    return {
        selectCard: cardId => dispatch(selectCard(cardId)),
        deselectCard: cardId => dispatch(deselectCard(cardId))
    };
};

const CardContainer = connect(null, mapDispatchToProps) (Card);

export default CardContainer;