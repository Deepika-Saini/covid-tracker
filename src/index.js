import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import statesAbbr from './states';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

function RoutingLogic() {
  return (
    <Fragment>
      <h1 className="covid-header">COVID TRACKER</h1>
      <Router>
        <div>
          <Link className="home-link" to="/">Go to Main Page</Link>
          <Switch>
            <Route exact path="/">
              <CovidTrackerApp stateName="India"/>
            </Route>
            
            <Route path={`/:stateId`}>
              <StatePage />
            </Route>
          </Switch>
        </div>
      </Router>
    </Fragment>
  );
}

class CovidTrackerApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      covidData: []
    };
    
    this.handleSearch = this.handleSearch.bind(this);
  }

  handleSearch(searchText) {
    this.setState({
      searchText: searchText
    });
  }

  componentDidMount() {
    const expiry = 5 * 60;
    const cacheKey = "https://api.covid19india.org/v4/min/data.min.json";
    let isCached = true;
    let cacheData = localStorage.getItem(cacheKey)
    let cacheTime = localStorage.getItem(cacheKey + ':ts')
    if (cacheData !== null && cacheTime !== null) {
      let age = (Date.now() - cacheTime) / 1000
      if (age < expiry) {
        const covidData = JSON.parse(cacheData);
        this.setState({ covidData });
      } else {
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(cacheKey + ':ts');
        isCached = false;
      }
    } else {
      isCached = false;
    }
    if (!isCached) {
      axios.get(`https://api.covid19india.org/v4/min/data.min.json`)
      .then(res => {
        const covidData = res.data;
        this.setState({ covidData });
        localStorage.setItem(cacheKey, JSON.stringify(covidData));
        localStorage.setItem(cacheKey+':ts', Date.now());
      })
    }
  }

  render() {
  return (
    <div className="app-area">
      <h2 className="state-name">
        {
          this.props.stateName === "India" ?
          "INDIA" :
          statesAbbr[this.props.stateName].toUpperCase()
        }
      </h2>
      {
        this.props.stateName === "India" ?
        <SearchBar
          searchText={this.state.searchText}
          onSearch={this.handleSearch}
        /> :
        null
      }
      <StatTiles
        covidData={this.state.covidData}
        stateName={this.props.stateName}
      />
      <StateTable 
        covidData={this.state.covidData} 
        stateName={this.props.stateName}
        searchText={this.state.searchText}
      />
    </div>
  );
  }
}

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleSearch = this.handleSearch.bind(this);
  }
  
  handleSearch(e) {
    this.props.onSearch(e.target.value);
  }
  
  render() {
  return (
    <form className="search-bar-area">
      <input
        className="search-bar"
        type="text"
        placeholder="Search your state..."
        value={this.props.searchText}
        onChange={this.handleSearch}
      />
    </form>
  );
  }
}

class StatTiles extends React.Component {
  render() {
    let data = this.props.covidData;
    let state = this.props.stateName;
    if (data.length === 0) {
      return null;
    }

    let confirmedCases = 0, testedCases = 0, recoveredCases = 0, deceasedCases = 0;

    if (state === "India") {
      Object.keys(data).map((state) => {
        confirmedCases += (data[state].total.confirmed ? data[state].total.confirmed : 0);
        testedCases += (data[state].total.tested ? data[state].total.tested : 0);
        recoveredCases += (data[state].total.recovered ? data[state].total.recovered : 0);
        deceasedCases += (data[state].total.deceased ? data[state].total.deceased : 0);
        return null;
      });
    } else {
      confirmedCases = data[state].total.confirmed;
      testedCases = data[state].total.tested;
      recoveredCases = data[state].total.recovered;
      deceasedCases = data[state].total.deceased;
    }

  return (
    <div className="stats">
      <div className="stat-tile">
        <div>"Total Confirmed"</div>
        {confirmedCases}
      </div>
      <div className="stat-tile">
        <div>"Tested"</div>
        {testedCases}
      </div>
      <div className="stat-tile">
        <div>"Recovered"</div>
        {recoveredCases}
      </div>
      <div className="stat-tile">
        <div>"Deceased"</div>
        {deceasedCases}
      </div>
    </div>
  );
  }
}

class StateTable extends React.Component {
  render() {
    const rows = [];
    const searchText = this.props.searchText;
    const totalData = this.props.covidData;
    const stateName = this.props.stateName;
    if (totalData.length === 0) {
      return null;
    }

    let covidData = (stateName === "India" ? totalData : totalData[stateName].districts);
  
    Object.keys(covidData).map((state) => {
      if (statesAbbr[state] && statesAbbr[state].toLowerCase().indexOf(searchText.toLowerCase()) === -1) {
        return null;
      }
      rows.push(
        <StateTableRow key={state}
          state={state}
          confirmed={covidData[state].total.confirmed ? covidData[state].total.confirmed : "-"}
          tested={covidData[state].total.tested ? covidData[state].total.tested : "-"}
          recovered={covidData[state].total.recovered ? covidData[state].total.recovered : "-"}
          deceased={covidData[state].total.deceased ? covidData[state].total.deceased : "-"}
          stateName={stateName}
        />
      );
      return null;
  });

  return (
    <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Confirmed</th>
            <th>Tested</th>
            <th>Recovered</th>
            <th>Deceased</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
  );
  }
}

function StateTableRow(props) {
    const state = props.state;
    const confirmed = props.confirmed;
    const tested = props.tested;
    const recovered = props.recovered;
    const deceased = props.deceased;

    return (
      <tr>
        <td>
          {props.stateName === "India" ? 
            <Link to={state}>{statesAbbr[state]}</Link> :
            state
          }
        </td>
        <td>{confirmed}</td>
        <td>{tested}</td>
        <td>{recovered}</td>
        <td>{deceased}</td>
      </tr>
    );
}

function StatePage() {
  let { stateId } = useParams();
  return (
    <CovidTrackerApp stateName={stateId}/>
  );
}

ReactDOM.render(
    <RoutingLogic/>,
  document.getElementById('root')
);