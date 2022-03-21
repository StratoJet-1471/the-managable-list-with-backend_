import { connect } from 'react-redux';
import {updateCardsSequenceInfo, updateCardsProducedSequenceInfo, initialFetch, fetchCardsToExpandList, fetchForSearch, resetCardsStateToDefault} from '../react-redux-store/cardsSlice';

import Main from './Main';

const mapStateToProps = state => {
    return {
        cards: state.cards,
        cardsSequenceInfo: state.cardsSequenceInfo,
        cardsProducedSequenceInfo: state.cardsProducedSequenceInfo,
        initialFetchStatus: state.initialFetchStatus,
        fetchToExpandListStatus: state.fetchToExpandListStatus,
        fetchForSearchStatus: state.fetchForSearchStatus
    };
};

const mapDispatchToProps = (dispatch) => {
    return {     
        updateCardsSequenceInfo: newSequence => dispatch(updateCardsSequenceInfo(newSequence)),
        updateCardsProducedSequenceInfo: newObtainedSequence => dispatch(updateCardsProducedSequenceInfo(newObtainedSequence)),
        resetCardsStateToDefault: () => dispatch(resetCardsStateToDefault()),
        initialFetch: () => dispatch(initialFetch()),
        fetchCardsToExpandList: (idsToFetch) => dispatch(fetchCardsToExpandList(idsToFetch)),
        fetchForSearch: (strToSearch) => dispatch(fetchForSearch(strToSearch)),
    };
};

const MainContainer = connect(mapStateToProps, mapDispatchToProps) (Main);

export default MainContainer;