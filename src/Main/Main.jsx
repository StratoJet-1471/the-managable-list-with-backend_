import React, {useState, useEffect} from 'react';

import CardsListContainer from '../CardsList/CardsListContainer';
import {CARDS_LIST_CHUNK_SIZE, BROWSER_STORAGE_KEY} from '../auxiliary-js-modules/defaults';

import '../auxiliary-css/cross-modules-elements.css';
import './Main.css';

export default function Main({
    cards, 
    cardsSequenceInfo,
    cardsProducedSequenceInfo,
    initialFetchStatus, 
    fetchForSearchStatus,
    updateCardsSequenceInfo,
    updateCardsProducedSequenceInfo, 
    resetCardsStateToDefault, 
    initialFetch,
    fetchCardsToExpandList,
    fetchForSearch}) {
    const [selectedCardsOnlyFilter, setSelectedCardsOnlyFilter] = useState(false);
    const [isSearchResult, setIsSearchResult] = useState(false);
    const [cardsListLength, setCardsListLength] = useState(CARDS_LIST_CHUNK_SIZE);
    const [cardsProducedListLength, setCardsProducedListLength] = useState(CARDS_LIST_CHUNK_SIZE);
    const [shouldExpandCardsList, setShouldExpandCardsList] = useState(false);

    const cardsSequenceLength = Object.keys(cardsSequenceInfo).length;
    const cardsProducedSequenceLength = Object.keys(cardsProducedSequenceInfo).length;

    const mapCardIdsToReallyFetchedCards = (ids) => {
        //Эта ф-я должна обеспечить, чтобы все карты с ids реально находились в cards. 

        const idsToFetch = ids.filter((id) => {
            if(cards[id]) return false;
            return true;
        });

        fetchCardsToExpandList(idsToFetch);
        //Если idsToFetch окажется пустым, мой санк так устроен, что в этом случае не будет делать фетч, а сразу вернёт Promise.resolve. При этом, как и с фетчем, состояние среагирует на статус fulfilled, и страница перерисуется.
    };


    const search = (e) => {
        e.preventDefault();
        const str = e.target.search.value.trim();
        if(str.length > 0) fetchForSearch(str);
    };

    const resetAll = () => {
        sessionStorage.removeItem(BROWSER_STORAGE_KEY);
        resetCardsStateToDefault();
        setSelectedCardsOnlyFilter(false);
        setIsSearchResult(false);
        resetCardsProducedSequence();
    };
    
    async function saveCardsSequenceInfo() {
        const url = "api/save-sequence";
        const options = {
            method: 'POST',
            body: JSON.stringify(cardsSequenceInfo)
        };

        try {
            const response = await fetch(url, options);
    
            if(response.ok) {
                alert("Ваш порядок карточек успешно сохранён"); 
                return Promise.resolve();
            }
            else throw new Error("ERROR! RESPONSE STATUS " + response.status);
    
        } catch(err) {
            alert(err.message);
            return Promise.reject();
        }
    };

    async function loadCardsSequenceInfo() {
        const url = "api/load-sequence";
        const options = {
            method: 'GET',
        };

        try {
            const response = await fetch(url, options);

            let loadedCardsSequenceInfo;        
            if(response.ok) loadedCardsSequenceInfo = await response.json(); //loadedCardsSequenceInfo - {id1: indexInSequence1, id2: indexInSequence2,...}
            else throw new Error("ERROR! RESPONSE STATUS " + response.status);

            const objectFromStorage = sessionStorage.getItem(BROWSER_STORAGE_KEY) ? JSON.parse(sessionStorage.getItem(BROWSER_STORAGE_KEY)) : null;
            let newSessionStorageContent = {};
            const loadedIds = Object.keys(loadedCardsSequenceInfo);
            for (let id of loadedIds) {
                newSessionStorageContent[id] = {indexInCardsSequence: loadedCardsSequenceInfo[id], selected: (objectFromStorage ? objectFromStorage[id].selected : false)};
            }
            sessionStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(newSessionStorageContent));

            updateCardsSequenceInfo(loadedCardsSequenceInfo);

            return Promise.resolve();
            
        } catch(err) {
            alert(err.message);
            return Promise.reject();
        }

    };

    const resetCardsProducedSequence = () => {
        updateCardsProducedSequenceInfo({});
    }

        
    const toggleSelectedCardsOnlyFilter = () => {
        if(selectedCardsOnlyFilter) {//Нужно ВЫключить
            setSelectedCardsOnlyFilter(false);
            resetCardsProducedSequence();
        }
        else { //Нужно включить
            const selectedCardsInfo = {};
            const allIds = Object.keys(cardsSequenceInfo);
            let i = 0;
            for(let id of allIds) {
               if(cards[id] && cards[id].selected) {
                   selectedCardsInfo[id] = {indexInMainSequence: cardsSequenceInfo[id], indexInProducedSequence: i};
                   i++;
               }
            }
            setSelectedCardsOnlyFilter(true);
            if(isSearchResult) setIsSearchResult(false);
            updateCardsProducedSequenceInfo(selectedCardsInfo);            
        }       
    };

    const resetSearchResult = () => {
        if(isSearchResult) {
            setIsSearchResult(false);
            resetCardsProducedSequence();
        }
    };

    //Обработчик скроллинга. Он ловит момент, когда страница перемотана почти до низу, и даёт команду расширить список.
    const scrollHandler = (e) => {
        if(e.target.documentElement.scrollHeight - (e.target.documentElement.scrollTop + window.innerHeight) < 100) {
            setShouldExpandCardsList(true);
        }
        else {
            setShouldExpandCardsList(false);
        }
    };

    //Вешаем слушатель на событие скролла.
    useEffect(() => {
        document.addEventListener('scroll', scrollHandler);
        return () => document.removeEventListener('scroll', scrollHandler);
    }, []);

    useEffect(() => initialFetch(), []);   
    
    //Расширяем показываемый список. 
    useEffect(() => {
        if(shouldExpandCardsList) {
            if(selectedCardsOnlyFilter ||isSearchResult) {
                //Здесь ничего подгружать с сервера не надо, т.к. всё уже загружено.
                if(cardsProducedListLength <= cardsProducedSequenceLength - CARDS_LIST_CHUNK_SIZE) setCardsProducedListLength(cardsProducedListLength + CARDS_LIST_CHUNK_SIZE);
                else setCardsProducedListLength(cardsProducedSequenceLength);                
            }
            else {                
                if(cardsListLength <= cardsSequenceLength - CARDS_LIST_CHUNK_SIZE) setCardsListLength(cardsListLength + CARDS_LIST_CHUNK_SIZE);
                else {
                    if(cardsListLength < cardsSequenceLength) setCardsListLength(cardsSequenceLength); 
                    //В противном случае достигнут конец всего списка данных, и дальше расширять список не нужно.   
                }
            }
        }

    }, [shouldExpandCardsList]);

    useEffect(() => {
        //Когда выходим из результатов поиска/фильтра "только выделенные", длина их списка устанавливается снова в дефолтное значение.
        if(!selectedCardsOnlyFilter && !isSearchResult) {
            setCardsProducedListLength(CARDS_LIST_CHUNK_SIZE);
        }
    }, [selectedCardsOnlyFilter, isSearchResult]);

    useEffect(() => {
        //Срабатывает, когда мы меняем cardsListLength и хотим этим вызвать подзагрузку.
        if(shouldExpandCardsList) { 
            //cardsListLength - CARDS_LIST_CHUNK_SIZE - потому что мы уже увеличили cardsListLength на CARDS_LIST_CHUNK_SIZE, чем и вызвали этот useEffect().
            //Этот способ, возможно, захватит и некоторые уже существующие в cards cardId'ы - но это ни на что не повлияет, они просто не попадут в запрос к серверу.
            const entries = Object.entries(cardsSequenceInfo).sort((entry1, entry2) => entry1[1] - entry2[1]); //[[id1, indexInMainCardsSequence1], [id2, indexInMainCardsSequence2], ...]
            const actualEntries = entries.slice(cardsListLength - CARDS_LIST_CHUNK_SIZE, cardsListLength);
            const cardIdsToFetch = actualEntries.map((entry) => entry[0]);
            mapCardIdsToReallyFetchedCards(cardIdsToFetch);
        }
    }, [cardsListLength])

    useEffect(() => {
        if(fetchForSearchStatus==='fulfilled') {
            setIsSearchResult(true);
            if(selectedCardsOnlyFilter) setSelectedCardsOnlyFilter(false);                      
        }
    }, [fetchForSearchStatus]);



    if(initialFetchStatus==='pending' || initialFetchStatus===null) return <span>Loading...</span>;
    if(initialFetchStatus==='rejected' || fetchForSearchStatus==='rejected') return <span className='error-text'>Fetch error!</span>;

    return (
        <div className='uni-centering-container uni-centering-container_column'>
            <div className="content-container">
                <header> 
                    <div className='uni-centering-container' style={{justifyContent:'space-between', paddingBottom:'3px'}}>
                        <span className='reset-all' title='Resets cards sequence to default' onClick={() => resetAll()}>Reset all</span>
                        <div>
                            <span className='cards-sequence-manager' style={{marginLeft: '10px', marginRight: '10px'}} onClick={() => saveCardsSequenceInfo()}>Save cards sequence</span>                        
                            <span className='cards-sequence-manager' onClick={() => {loadCardsSequenceInfo()}}>Load cards sequence</span>
                        </div>
                    </div>
                    <div className="controls-panel">
                        <div><input type="checkbox" checked={selectedCardsOnlyFilter} onChange={() => toggleSelectedCardsOnlyFilter()}/> Selected only</div>
                        
                        <div style={{display:'flex', flexDirection:'row', alignItems: 'center', justifyContent:'center'}}>
                            <button className='controls-panel__button' onClick={ () => resetSearchResult()}>Reset search results</button>
                            <form className='controls-panel__form' onSubmit={(e) => search(e)}>
                                <input className='controls-panel__text-input' type="text" name="search" style={{marginRight: '3px'}}/>
                                <button className='controls-panel__button'>Find</button>
                            </form>
                        </div>
                    </div>
                </header>
                <main>      
                    <CardsListContainer useProducedCardsSequence={selectedCardsOnlyFilter || isSearchResult || false} length={(selectedCardsOnlyFilter || isSearchResult) ? cardsProducedListLength : cardsListLength}/>
                </main>
            </div>
        </div>
    );
}
