import { connect } from 'react-redux';
import { selectCard, deselectCard } from '../../react-redux-store/cardsSlice';

import CardsList__Card from './CardsList__Card';

const mapDispatchToProps = (dispatch) => {
    return {
        selectCard: cardId => dispatch(selectCard(cardId)),
        deselectCard: cardId => dispatch(deselectCard(cardId))
    };
};

const CardContainer = connect(null, mapDispatchToProps) (CardsList__Card);

export default CardContainer;