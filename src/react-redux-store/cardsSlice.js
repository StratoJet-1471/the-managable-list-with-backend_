import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

async function fetchJSON(url, options) {
    try {
        const response = await fetch(url, options);

        if(response.ok) return await response.json(); 
        else throw new Error("RESPONSE STATUS " + response.status);

    } catch(err) {
        return Promise.reject(err.message);
    }
}

export const initialFetch = createAsyncThunk(
    'initialFetch',
    async function() {
        const sourceUrl = "api/get-main-meta-data";
        const fetch_options = {
          method: 'GET',
        };   
        return fetchJSON(sourceUrl, fetch_options);
    }
);

export const fetchCardsByIds = createAsyncThunk(
    'fetchCardsByIds',
    async function(requestDataJSON) {
        const sourceUrl = "api/get-data";
        const fetch_options = {
            method: 'POST',
            body: requestDataJSON
        };   
        return fetchJSON(sourceUrl, fetch_options);
    }
);

export const fetchForSearch = createAsyncThunk(
    'fetchForSearch',
    async function(requestDataJSON) {
        const sourceUrl = "api/search";
        const fetch_options = {
          method: 'POST',
          body: requestDataJSON
        };           

        return fetchJSON(sourceUrl, fetch_options);
    }
);

const cardsSlice = createSlice({ 
    name: 'cards',
    initialState: {
        cards: {}, //После загрузки данных карт свойства будут выглядеть так: "идентификаторКарты":{ content: "..."}
        cardsSequenceInfo: {}, //{"идентификаторКарты-1": {indexInMainSequence: index1, selected: boolean}, ...} - последовательность вывода всего списка на экран сверху вниз.
        cardsProducedSequenceInfo: {}, //{"идентификаторКарты-1": { indexInProducedSequence: 0}, ...} - последовательность вывода списка, полученного в результате поиска или фильтра.
        initialFetchStatus: null, //"pending", "fulfilled", "rejected"
        fetchForSearchStatus: null, //"pending", "fulfilled", "rejected"

        fetchCardsByIdsStatus: null, //"pending", "fulfilled", "rejected"
    },
    reducers: {
        selectCard: (state, action) => { 
            const cardId = String(action.payload);
            state.cardsSequenceInfo[cardId].selected = true;
        },
        deselectCard: (state, action) => { 
            const cardId = String(action.payload);
            state.cardsSequenceInfo[cardId].selected = false;
        },
        updateCardsSequenceInfo: (state, action) => {
            state.cardsSequenceInfo = action.payload;
        },
        updateCardsProducedSequenceInfo: (state, action) => {
            state.cardsProducedSequenceInfo = action.payload;
        },
        resetCardsStateToDefault: (state) => {
            //Этот алгоритм заточен под то, что id у нас числовые.
            for (let id in state.cardsSequenceInfo) {
                state.cardsSequenceInfo[id].indexInMainSequence = Number(id) - 1;
                state.cardsSequenceInfo[id].selected = false;
            }
        }
    },

    extraReducers: {
        [fetchCardsByIds.pending]: (state) => {
            state.fetchCardsByIdsStatus = "pending";
        },
        [fetchCardsByIds.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = [Object]
            */           
            for (let obj of action.payload) {
                state.cards[String(obj.id)] = {selected: false, content: obj.body};                
                //state.cards.amount++;
            }
            state.fetchCardsByIdsStatus = "fulfilled";

        },
        [fetchCardsByIds.rejected]: (state) => {
            state.fetchCardsByIdsStatus = "rejected";
        },


        [initialFetch.pending]: (state) => {
            state.initialFetchStatus = "pending";
        },
        [initialFetch.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = {"идентификаторКарты-1": {indexInMainSequence: index1, selected: boolean}, ...} - это состояние cardsSequenceInfo
            */           
            state.cardsSequenceInfo = action.payload;
            //console.log(action.payload);

            state.initialFetchStatus = "fulfilled";
        },
        [initialFetch.rejected]: (state) => {
            state.initialFetchStatus = "rejected";
        },

        [fetchForSearch.pending]: (state) => {
            state.fetchForSearchStatus = "pending";
        }, 
        [fetchForSearch.fulfilled]: (state, action) => { 
            /*
                Здесь action.payload = {
                    foundIds: [number]
                    newDataObjects: [Object]
                };
            */           
            for (let obj of action.payload.newDataObjects) {
                state.cards[String(obj.id)] = {content: obj.body};                
                //state.cards.amount++;
            }
            
            state.cardsProducedSequenceInfo = {};
            for (let i = 0; i < action.payload.foundIds.length; i++) {
                const id = action.payload.foundIds[i];
                state.cardsProducedSequenceInfo[String(id)] = { indexInProducedSequence: i};
            }

            state.fetchForSearchStatus = "fulfilled";
        },
        [fetchForSearch.rejected]: (state) => {
            state.fetchForSearchStatus = "rejected";
        } 
    }
});
export const {selectCard, deselectCard, updateCardsSequenceInfo, updateCardsProducedSequenceInfo, resetCardsStateToDefault} = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;