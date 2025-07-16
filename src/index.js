import React from 'react';
import { render } from 'react-dom';
import Chart from './App2';
import { getData } from "./utils"
import "./App.css"
import { TypeChooser } from "../src/lib/helper";
import "../src/stylesheets/another.css";

class ChartComponent extends React.Component {
	componentDidMount() {
		getData().then(data => {
			this.setState({ data })
		})
	}
	render() {
		if (this.state == null) {
			return <div>Loading...</div>
		}
		return (
			<>
				<div>
					<TypeChooser>
						{type => <Chart type={type} data={this.state.data} />}
					</TypeChooser>
				</div>
			</>
		)
	}
}

render(
	<ChartComponent />,
	document.getElementById("root")
);