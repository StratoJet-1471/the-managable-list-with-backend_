import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CARDS_LIST_CHUNK_SIZE } from '../auxiliary-js-modules/defaults';

async function fetchJSON(url, options) {
    try {
        const response = await fetch(url, options);

        if(response.ok) return await response.json(); 
        else throw new Error("RESPONSE STATUS " + response.status);

    } catch(err) {
        //return createRejectPromiseFunc(err.message);
        return Promise.reject(err.message);
    }
}

export const initialFetch = createAsyncThunk(
    'initialFetch',
    async function() {
        //const sourceUrl = "https://jsonplaceholder.typicode.com/posts";
        const metaData = {
            elementsN: CARDS_LIST_CHUNK_SIZE
        };
        const sourceUrl = "api/get-initial-data";
        const fetch_options = {
          method: 'POST',
          body: JSON.stringify(metaData)
        };   
        return fetchJSON(sourceUrl, fetch_options);
    }
);


export const fetchCardsToExpandList = createAsyncThunk(
    'fetchCardsToExpandList',
    async function(idsToFetch) {
        if(idsToFetch.length==0) {
            return Promise.resolve([]);
        }
        else {
            const metaData = {
                elementIds: idsToFetch.slice()
            };
            const sourceUrl = "api/get-extended-data";
            const fetch_options = {
              method: 'POST',
              body: JSON.stringify(metaData)
            };   
            return fetchJSON(sourceUrl, fetch_options);
        }
    }
);

export const fetchForSearch = createAsyncThunk(
    'fetchForSearch',
    async function(strToSearch) {
        const metaData = { strToSearch };
        const sourceUrl = "api/search";
        const fetch_options = {
          method: 'POST',
          body: JSON.stringify(metaData)
        };           

        return fetchJSON(sourceUrl, fetch_options);
    }
);

const createCardsObject = () => {
    let cardsObject = {};
    Object.defineProperty(cardsObject, "amount", {enumerable: false, value: 0});
    return cardsObject;
};

const cardsSlice = createSlice({ 
    name: 'cards',
    initialState: {
        cards: createCardsObject(), //После загрузки данных карт свойства будут выглядеть так: "идентификаторКарты":{selected: true/false, content: "..."}
        cardsSequenceInfo: {}, //{"идентификаторКарты-1": 0, "идентификаторКарты-2": 1, ...} - последовательность вывода всего списка на экран сверху вниз.
        cardsProducedSequenceInfo: {}, //{"идентификаторКарты-1": {indexInMainSequence: index1, indexInProducedSequence: 0}, "идентификаторКарты-2": {indexInSequence: index2, indexInProducedSequence: 1}, ...} - последовательность вывода списка, полученного в результате поиска или фильтра (т.к. ).
        initialFetchStatus: null, //"pending", "fulfilled", "rejected"
        fetchToExpandListStatus: null, //"pending", "fulfilled", "rejected"
        fetchForSearchStatus: null, //"pending", "fulfilled", "rejected"
    },
    reducers: {
        selectCard: (state, action) => { 
            const cardId = String(action.payload);
            state.cards[cardId].selected = true; 
        },
        deselectCard: (state, action) => { 
            const cardId = String(action.payload);
            state.cards[cardId].selected = false; 
        },
        updateAllInfoAboutSelectedCards: (state, action) => {//action.payload - массив объектов вида {id: идентификаторКарты, selected: true/false}.
            for (let infoObj of action.payload) {
                if(state.cards[infoObj.id]) state.cards[infoObj.id].selected = infoObj.selected;
            }
        },
        updateCardsSequenceInfo: (state, action) => {
            state.cardsSequenceInfo = action.payload;
        },
        updateCardsProducedSequenceInfo: (state, action) => {
            state.cardsProducedSequenceInfo = action.payload;
        },
        resetCardsStateToDefault: (state) => {
            for (let cardId in state.cards) {
                state.cards[cardId].selected = false;
            }
            const sortedIds = Object.keys(state.cards).sort((a,b) => Number(a) - Number(b));
            state.cardsSequenceInfo = {};
            for(let i = 0; i < sortedIds.length; i++) {
                state.cardsSequenceInfo[sortedIds[i]] = i;
            }
        }
    },

    extraReducers: {
        [initialFetch.pending]: (state) => {
            state.initialFetchStatus = "pending";
        },
        [initialFetch.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = {
                    allIds: [Number],
                    infoObjects: [Object]
                }
            */           
            for (let obj of action.payload.infoObjects) {
                state.cards[String(obj.id)] = {selected: false, content: obj.body};
                state.cards.amount++;
            }

            for (let i = 0; i < action.payload.allIds.length; i++) {
                state.cardsSequenceInfo[String(action.payload.allIds[i])] = i;
            }

            state.initialFetchStatus = "fulfilled";
        },
        [initialFetch.rejected]: (state) => {
            state.initialFetchStatus = "rejected";
        },

        [fetchCardsToExpandList.pending]: (state) => {
            state.fetchToExpandListStatus = "pending";
        }, 
        [fetchCardsToExpandList.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = [Object]
            */           
            for (let obj of action.payload) {
                state.cards[String(obj.id)] = {selected: false, content: obj.body};                
                state.cards.amount++;
            }
            state.fetchToExpandListStatus = "fulfilled";

        },
        [fetchCardsToExpandList.rejected]: (state) => {
            state.fetchToExpandListStatus = "rejected";
        },

        [fetchForSearch.pending]: (state) => {
            state.fetchForSearchStatus = "pending";
        }, 
        [fetchForSearch.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = {
                    foundIds: [number]
                    previouslyUnsentInfoObjects: [Object]
                };
            */           

            for (let obj of action.payload.previouslyUnsentInfoObjects) {
                state.cards[String(obj.id)] = {selected: false, content: obj.body};                
                state.cards.amount++;
            }
            
            state.cardsProducedSequenceInfo = {};
            for (let i = 0; i < action.payload.foundIds.length; i++) {
                const id = action.payload.foundIds[i];
                state.cardsProducedSequenceInfo[String(id)] = { indexInMainSequence: state.cardsSequenceInfo[String(id)], indexInProducedSequence: i};
            }

            state.fetchForSearchStatus = "fulfilled";
        },
        [fetchForSearch.rejected]: (state) => {
            state.fetchForSearchStatus = "rejected";
        } 
    }
});
export const {selectCard, deselectCard, updateAllInfoAboutSelectedCards, updateCardsSequenceInfo, updateCardsProducedSequenceInfo, resetCardsStateToDefault} = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;