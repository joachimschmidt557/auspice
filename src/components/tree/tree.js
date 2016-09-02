import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from './framework/flex';
import { connect } from "react-redux";
// import { FOO } from "../actions";
// import { visualization } from "../../visualization/visualization";
import d3 from "d3";
import Link from "./branch";
import Node from "./node";
import Tooltip from "./tooltip";
import { processNodes } from "../../util/processNodes";
import * as globals from "../../util/globals";
import moment from "moment";
import "moment-range";
import {VictoryAnimation} from "victory";

const returnStateNeeded = (fullStateTree) => {
  return {
    metadata: fullStateTree.metadata,
    tree: fullStateTree.tree,
    sequences: fullStateTree.sequences,
    frequencies: fullStateTree.frequencies,
    controls: fullStateTree.controls
  };
};

@connect(returnStateNeeded)
@Radium
class Tree extends React.Component {
  constructor(props) {
    super(props);

    const tree = d3.layout.tree()
      .size([this.treePlotHeight(globals.width), globals.width]);
    const nodes = processNodes(tree.nodes(props.tree.tree));
    const links = tree.links(nodes);

    const xValues = nodes.map((d) => {
      return +d.xvalue;
    });

    const yValues = nodes.map((d) => {
      return +d.yvalue;
    });
    const nNodes = nodes.filter((d) => { return typeof d.children==="undefined";}).length;

    this.state = {
      width: globals.width,
      nodes,
      links,
      nNodes,
      remove_me: 0,
      xScale: d3.scale.linear()
                      .domain([d3.min(xValues), d3.max(xValues)])
                      .range([globals.margin, globals.width - globals.margin]),
      yScale: d3.scale.linear()
                      .domain([d3.min(yValues), d3.max(yValues)])
                      .range([globals.margin, this.treePlotHeight(globals.width) - globals.margin])
    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    controls: React.PropTypes.object,
    metadata: React.PropTypes.object,
    tree: React.PropTypes.object,
    sequences: React.PropTypes.object,
    frequencies: React.PropTypes.object
  }
  static defaultProps = {
    // foo: "bar"
  }
  componentDidMount() {
    // visualization(
    //   this.props.tree.tree,
    //   this.props.sequences.sequences,
    //   this.props.frequencies.frequencies,
    //   null /* todo: this is vaccineStrains */
    // )
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }
  drawNodes(nodes) {
    const range = moment().range(
      new Date(+this.props.query.dmin),
      new Date(+this.props.query.dmax)
    )
    function xVal(node, layout, scale, xScale, nNodes){
      var x = (scale=='time') ? xScale(node.xvalue) : xScale(node.tvalue / 300);
      if (layout=='rectangular'){
        return x;
      }else if(layout=='radial'){
        var theta = 6.283*node.yvalue/nNodes;
        return Math.sin(theta)*x*0.3+500;
      }
    }
    function yVal(node, layout, scale, xScale, yScale, nNodes){
      if (layout=='rectangular'){
        return yScale(node.yvalue);
      }else if(layout=='radial'){
        var x = (scale=='time') ? xScale(node.xvalue) : xScale(node.tvalue / 300);
        var theta = 6.283*node.yvalue/nNodes;
        return Math.cos(theta)*x*0.3+500;
      }
    }
    const nodeComponents = nodes.map((node, index) => {
     return (
        <VictoryAnimation duration={1000} key={index} data={{
            x: xVal(node, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.nNodes),
            y: yVal(node, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.yScale, this.state.nNodes)
          }}>
          {(props) => {
            return (
              <Node
                {...this.props} {...props} animate={null}
                controls={this.props.controls}
                node={node}
                dateRange={range}
                fill={this.props.controls.colorScale(node.attr[this.props.controls.colorBy])}
                nuc_muts={node.nuc_muts}
                showBranchLabels={this.props.controls.showBranchLabels}
                strain={node.strain}
                hasChildren={node.children ? true : false}/>
            )
          }}
        </VictoryAnimation>
      );
    });
    return nodeComponents;
  }
  drawBranches(links) {
    function xVal(node, layout, scale, xScale, nNodes){
      var x = (scale=='time') ? xScale(node.xvalue) : xScale(node.tvalue / 300);
      if (layout=='rectangular'){
        return x;
      }else if(layout=='radial'){
        var theta = 6.283*node.yvalue/nNodes;
        return Math.sin(theta)*x*0.3+500;
      }
    }
    function yVal(node, layout, scale, xScale, yScale, nNodes){
      if (layout=='rectangular'){
        return yScale(node.yvalue);
      }else if(layout=='radial'){
        var x = (scale=='time') ? xScale(node.xvalue) : xScale(node.tvalue / 300);
        var theta = 6.283*node.yvalue/nNodes;
        return Math.cos(theta)*x*0.3+500;
      }
    }
    const branchComponents = links.map((link, index) => {
      return (
        <VictoryAnimation duration={1000} key={index} data={{
            target_x: xVal(link.target, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.nNodes),
            target_y: yVal(link.target, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.yScale, this.state.nNodes),
            source_x: xVal(link.source, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.nNodes),
            source_y: yVal(link.source, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time", this.state.xScale, this.state.yScale, this.state.nNodes),
        }}>
        {(props) => {
          return (
            <Link
              {...this.props} {...props} animate={null}
              key={index} />
           );}}
      </VictoryAnimation>
      );
    });
    return branchComponents;
  }
  drawTooltip(node, type) {
    return (
      <Tooltip
        type={type}
        node={node}
        x={this.state.xScale(node.xvalue)}
        y={this.state.yScale(node.yvalue)}/>
    )
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <svg
          onClick={() => { this.setState({remove_me: this.state.remove_me+1}) }}
          height={this.treePlotHeight(this.state.width)}
          width={this.state.width}
          id="treeplot"
          style={{
          }}>
          {this.drawBranches(this.state.links)}
          {this.drawNodes(this.state.nodes)}
          {
            this.props.controls.selectedBranch ?
            this.drawTooltip(this.props.controls.selectedBranch.target, "branch") :
            null
          }
          {
            this.props.controls.selectedNode ?
            this.drawTooltip(this.props.controls.selectedNode, "node") :
            null
          }
        </svg>
      </div>
    );
  }
}

export default Tree;
