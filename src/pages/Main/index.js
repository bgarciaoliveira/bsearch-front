import React, { Component } from 'react'
import ReactLoading from 'react-loading';
import api from '../../services/api'

import './styles.css'

export default class Main extends Component {

    state = {

        //Keyword da caixa de pesquisa
        keyword: '',

        buttonGoogleDisabled: false,
        buttonBingDisabled: false,
        buttonAskDisabled: false,
        loadingVisible: false,

        search: {

            //Keyword utilizada na pesquisa
            keyword: '',

            //Engine utilizada para a pesquisa            
            engine: '',

            //Total de resultados encontrados
            count: -1,

            //Pagina atual
            page: 0,

            //Resultados da pesquisa
            results: [],

            // Action buttons
            previousDisabled: false,
            nextDisabled: false,
        }
    }

    handleChange(e) {
        this.setState({ keyword: e.target.value })
    }

    resetSearch = () => {

        this.setState({
            buttonGoogleDisabled: false,
            buttonBingDisabled: false,
            buttonAskDisabled: false,
            loadingVisible: false,
            search: {
                keyword: '',
                engine: '',
                count: -1,
                page: 0,
                results: [],
                previousEnabled: false,
                nextEnabled: false
            }
        })
    }

    setSearchButtonsDisabledStatus = (status) => {
        this.setState({
            buttonGoogleDisabled: status,
            buttonBingDisabled: status,
            buttonAskDisabled: status,
            loadingVisible: status === true,

        })
    }

    setActionButtonsDisabledStatus = (status) => {
        this.setState({
            search: {
                ...this.state.search,
                previousDisabled: status,
                nextDisabled: status
            }
        })
    }

    calculateFirst = (page) => {
        if (page === 1) return 1

        return (page * 10) - 10
    }

    calculateMaxPage = () => {
        return parseInt(this.state.search.count / 10)
    }

    getBrLocaleNumber = (number) => {
        return Number(number).toLocaleString('pt-BR')
    }

    buttonSearchOnClick = async (engine) =>{

        const keyword = this.state.keyword

        if (keyword === '') {
            this.resetSearch()
        }
        else {

            this.setSearchButtonsDisabledStatus(true)

            try{
                const response = await api.get(`/search?keyword=${this.state.keyword}&engine=${engine}&first=1`)

                if (response.status === 200 || response.status === 204) {

                    this.setState({
                        search: {
                            keyword,
                            engine: engine,
                            count: response.status === 200 ? response.data.resultStat : 0,
                            results: response.data.titlesAndLinks,
                            page: 1
                        }
                    })
                }
            }
            finally{
                this.setSearchButtonsDisabledStatus(false)
            }
        }
    }

    previousPage = async () => {

        if (this.state.search.page === 1) return

        this.setActionButtonsDisabledStatus(true)

        try {
            const first = this.calculateFirst(this.state.search.page - 1)

            const response = await api.get(`/search?keyword=${this.state.search.keyword}&engine=${this.state.search.engine}&first=${first}`)

            if (response.status === 200 || response.status === 204) {

                this.setState({
                    search: {
                        ...this.state.search,
                        results: response.data.titlesAndLinks,
                        page: this.state.search.page - 1
                    }
                })

            } else {
                this.resetSearch()
            }
        }
        finally {
            this.setActionButtonsDisabledStatus(false)
        }
    }

    nextPage = async () => {
        if (this.state.search.page > this.calculateMaxPage()) return

        this.setActionButtonsDisabledStatus(true)

        try {

            const first = this.calculateFirst(this.state.search.page + 1)

            const response = await api.get(`/search?keyword=${this.state.search.keyword}&engine=${this.state.search.engine}&first=${first}`)

            if (response.status === 200 || response.status === 204) {

                this.setState({
                    search: {
                        ...this.state.search,
                        results: response.data.titlesAndLinks,
                        page: this.state.search.page + 1
                    }
                })

            } else {
                this.resetSearch()
            }
        }
        finally{
            this.setActionButtonsDisabledStatus(false)
        }
    }

    render() {
        return (
            <div className="main">

                <div className="search-box">
                    <div className="content">
                        <form>
                            <input type="text" className="keyword-input" placeholder="Digite sua pesquisa e clique no motor de buscas desejado"
                            value={this.state.keyword}
                            onChange={this.handleChange.bind(this)} 
                            onKeyPress={e => { 
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    this.buttonSearchOnClick('google')
                                }
                            }}
                            />

                            <div className="button-box">
                                <input type="button" disabled={this.state.buttonGoogleDisabled} className="google-button" value="Google" onClick={() => this.buttonSearchOnClick('google')} />
                                <input type="button" disabled={this.state.buttonBingDisabled} className="bing-button" value="Bing!" onClick={() => this.buttonSearchOnClick('bing')} />
                                <input type="button" disabled={this.state.buttonAskDisabled} className="ask-button" value="Ask" onClick={() => this.buttonSearchOnClick('ask')} />
                                
                                {this.state.loadingVisible ? (<ReactLoading className={"loading"} type={"spin"} height={25} width={25} color={"#9e9e9e"} />) : null}
                                
                            </div>
                        </form>
                    </div>
                </div>

                {this.state.search.count !== -1 ? (
                    <div className="result-box">

                        {this.state.search.count === 0 ? (

                            <h3>Não há resultados para '{this.state.search.keyword}' em {this.state.search.engine}</h3>

                        ) : (
                                <div>
                                    <h3>Mostrando resultados para <span className="text-orange">{this.state.search.keyword}</span> em <span className="text-orange">{this.state.search.engine}</span></h3>

                                    {this.state.search.engine !== 'ask' ? (
                                        <h6>Aproximadamente {this.getBrLocaleNumber(this.state.search.count)} resultados</h6>
                                    ) : (
                                        <h6>Não há informações sobre a quantidade de resultados</h6>                                        
                                    )}
                                    

                                    {this.state.search.results.map((result, index) => {
                                        return (
                                            <article key={index}>
                                                <strong>{result.title}</strong>
                                                <a href={result.link} target="_blank" rel="noopener noreferrer">Acessar</a>
                                            </article>
                                        )
                                    })}

                                    <div className="actions">
                                        {this.state.search.page !== 1 ? (
                                            <button disabled={this.state.search.previousDisabled} onClick={this.previousPage}>Anterior</button>
                                        ) : null}
                                        
                                        <span>Pagina atual: {this.state.search.page}</span>

                                        {this.state.search.page <= this.calculateMaxPage() ? (
                                            <button disabled={this.state.search.nextDisabled} onClick={this.nextPage}>Proxima</button>
                                        ) : null}
                                        
                                    </div>

                                </div>
                            )}

                    </div>
                ) : null}

            </div>
        )
    }
}

