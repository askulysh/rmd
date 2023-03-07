import React from "react";
import FQSelector from "./components/FQSelector";

class LoaderWrapper extends React.Component {
  state = {
    ready: false,
    imgs: [],
  };
  render() {
    if (this.state.ready) {
      return <FQSelector imgs={this.state.imgs} />;
    } else {
      return <div>...loading</div>;
    }
  }
  downloadImages() {
    return fetch("/api/images")
      .then((r) => r.json())
      .then((r) =>
        this.setState({
          imgs: r,
          ready: true,
        }, () => {
		setTimeout(() => {
		this.downloadImages();
		}, 1000*30)
        })
      );
  }
  componentDidMount() {
    this.downloadImages();
  }
}
export default LoaderWrapper;
