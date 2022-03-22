import React, {useState, useEffect} from 'react';

import CardsListContainer from '../CardsList/CardsListContainer';
import {CARDS_LIST_CHUNK_SIZE} from '../auxiliary-js-modules/defaults';

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
    fetchForSearch}) {
    const [currentMode, setCurrentMode] = useState("normal");  //"normal", "selected_only", "search_results"  

    const [visibleListLength, setVisibleListLength] = useState(CARDS_LIST_CHUNK_SIZE);
    const [shouldExpandCardsList, setShouldExpandCardsList] = useState(false);

    const search = (e) => {
        e.preventDefault();
        const strToSearch = e.target.search.value.trim();
        
        if(strToSearch.length > 0) {
            const alreadyLoadedIds = Object.keys(cards);
            const requestData = JSON.stringify({ strToSearch, alreadyLoadedIds});
            fetchForSearch(requestData);
        }
    };

    const resetAll = () => {
        resetCardsStateToDefault();
        setCurrentMode("normal");
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
        const url = "api/get-main-meta-data";
        const options = {
            method: 'GET',
        };

        try {
            const response = await fetch(url, options);

            let loadedCardsSequenceInfo;        
            if(response.ok) loadedCardsSequenceInfo = await response.json(); //loadedCardsSequenceInfo - {"идентификаторКарты-1": {indexInMainSequence: index1, selected: boolean}, ...}
            else throw new Error("ERROR! RESPONSE STATUS " + response.status);

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
        if(currentMode==="selected_only") {//Нужно ВЫключить фильтр
            setCurrentMode("normal");
            resetCardsProducedSequence();
        }
        else { //Нужно включить фильтр
            const selectedCardsInfo = {};
            const entries = Object.entries(cardsSequenceInfo).sort((entry1, entry2) => entry1[1].indexInMainSequence - entry2[1].indexInMainSequence);//[[id1, {indexInMainSequence: index1, selected: boolean}], ...]
            const allIds = entries.map((entry) => entry[0]);

            let i = 0;
            for(let id of allIds) {
               if(cardsSequenceInfo[id].selected) {
                   selectedCardsInfo[id] = { indexInProducedSequence: i};
                   i++;
               }
            }
     
            updateCardsProducedSequenceInfo(selectedCardsInfo); 
            setVisibleListLength(CARDS_LIST_CHUNK_SIZE);
            setCurrentMode("selected_only");             
        }       
    };

    const resetSearchResult = () => {
        resetCardsProducedSequence();
        setVisibleListLength(CARDS_LIST_CHUNK_SIZE);
        setCurrentMode("normal");
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


    useEffect(() => initialFetch(), []);   

    //При перемотке донизу меняем visibleListLength и провоцируем этим увеличение списка.
    useEffect(() => {
        if(shouldExpandCardsList) {
            let maxListLength;
            if(currentMode==="normal") maxListLength = Object.keys(cardsSequenceInfo).length;
            else maxListLength = Object.keys(cardsProducedSequenceInfo).length;

            if(visibleListLength <= maxListLength - CARDS_LIST_CHUNK_SIZE) setVisibleListLength(visibleListLength + CARDS_LIST_CHUNK_SIZE);
            else setVisibleListLength(maxListLength);       
            //Изменение visibleListLength вызовет перерисовку, которая через пропс length заставит cardsList подгрузить новые данные и увеличиться.
        }

    }, [shouldExpandCardsList]);

    //Вешаем слушатель на событие скролла.
    useEffect(() => {
        document.addEventListener('scroll', scrollHandler);
        return () => document.removeEventListener('scroll', scrollHandler);
    }, []);

    

    useEffect(() => {
        //При изменении режима мы всегода "откатываем" список к началу.
        setVisibleListLength(CARDS_LIST_CHUNK_SIZE);
    }, [currentMode]);

    useEffect(() => {
        if(fetchForSearchStatus==='fulfilled') setCurrentMode("search_results");
    }, [fetchForSearchStatus]);

    let searchingIndicator = null;
    if(fetchForSearchStatus==='pending') searchingIndicator = <div className='some-process-indicator'>Идёт поиск...</div>;

    if(initialFetchStatus==='pending' || initialFetchStatus===null) return <span>Loading...</span>;
    if(initialFetchStatus==='rejected' || fetchForSearchStatus==='rejected') return <span className='error-text'>Fetch error!</span>;

    return (        
        <div className='uni-centering-container uni-centering-container_column'>     
            {searchingIndicator}       
            <div className="content-container">
                <header> 
                    <div className='uni-centering-container' style={{justifyContent:'space-between', paddingBottom:'3px'}}>
                        <span className='reset-all' title='Resets cards sequence to default' onClick={() => resetAll()}>Reset all</span>
                        <div>
                            <span className='cards-sequence-manager' style={{marginLeft: '10px', marginRight: '10px'}} onClick={() => saveCardsSequenceInfo()}>Save cards info</span>                        
                            <span className='cards-sequence-manager' onClick={() => {loadCardsSequenceInfo()}}>Load cards info</span>
                        </div>
                    </div>
                    <div className="controls-panel">
                        <div><input type="checkbox" checked={currentMode==="selected_only"} onChange={() => toggleSelectedCardsOnlyFilter()}/> Selected only</div>
                        
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
                    <CardsListContainer mode={currentMode} length={visibleListLength}/>
                </main>
            </div>
        </div>
    );
}