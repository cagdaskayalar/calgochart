import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from './App4';
import { getData } from "./utils";
import "./App.css";

class ChartComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	componentDidMount() {
		getData().then(data => {
			this.setState({ data })
		});
	}

	render() {
		if (!this.state.data) {
			return <div>Loading...</div>;
		}
		return (
			<div>
				<Chart type="svg" data={this.state.data} />
			</div>
		)
	}
}

const root = createRoot(document.getElementById("root"));
root.render(<ChartComponent />);
