import React, {Component} from 'react';
import {TouchableOpacity, View, ScrollView} from 'react-native';

export class AHMYBannerView extends Component {
    static defaultProps = {
        banner: [],//banner数据数组
        style: {},//banner样式，主要是宽高
        autoScroll: false,//是否自动滚动
        duration: 0,//滚动间隔
    }

    constructor(props) {
        super(props);
        let banner = props.banner;
        let count = banner.length;
        //banner长度大于1并且需要自动滚动时，前后各加一个view
        if (count > 1 && props.autoScroll) {
            count = count + 2;
        }
        let currentIndex = props.autoScroll && count > 1 ? 1 : 0;
        this.state = {
            banner: props.banner,
            currentIndex: currentIndex,
            count: count
        }
        this.isFirstInit = true;
        this.mounted = false;
    }

    //可用于外部更新banner
    updateBanner(banner) {
        if (!this.mounted) {
            //防止组件已经被释放了，还在更新
            return;
        }
        this.stopTimer();
        let count = banner.length;
        //banner长度大于1并且需要自动滚动时，前后各加一个view
        if (count > 1 && this.props.autoScroll) {
            count = count + 2;
        }
        let currentIndex = this.props.autoScroll && count > 1 ? 1 : 0;
        this.setState({
            banner: banner,
            currentIndex: currentIndex,
            count: count
        }, () => {
            this.scrollview && this.scrollview.scrollTo({
                x: this.bannerWidth * this.state.currentIndex,
                animated: false
            });
            this.props.autoScroll && count > 1 && this.startTimer();
        })
    }

    componentDidMount() {
        this.mounted = true;
        this.props.autoScroll && this.state.count > 1 && this.startTimer();
    }

    componentWillUnmount() {
        this.mounted = false;
        this.stopTimer();//组件卸载时，清除定时器
    }

    startTimer() {
        if (!this.scrollview) {
            return;
        }
        this.timer = setInterval(() => {
            this.timerRun = true;
            this.scrollToPage(this.state.currentIndex + 1, false);
        }, this.props.duration)

    }

    stopTimer() {
        this.timerRun = false;
        this.timer && clearInterval(this.timer);
        this.timer = null;
        this.timer1 && clearTimeout(this.timer1);
        this.timer1 = null;
        this.timer2 && clearTimeout(this.timer2);
        this.timer2 = null;
    }

    onScrollBeginDrag = (event) => {
        this.stopTimer();
    }

    onScrollEndDrag = (event) => {
        if (this.props.autoScroll && this.state.count > 1) {
            this.startTimer();
        }
    }

    onMomentumScrollEnd = (event) => {
        if (!this.timerRun) {
            let currentindex = event.nativeEvent.contentOffset.x / this.bannerWidth;
            if (Math.abs(currentindex - this.state.currentIndex) > 0.05) {
                this.scrollToPage(currentindex, true);
            }
        }
    }

    scrollToPage(currentPage, userDrag) {
        // userDrag 是否是用户拖拽的滑动
        //有自动滚动
        if (this.props.autoScroll && this.state.count > 1) {
            if (currentPage === 0) {
                //最左边，需要重置到倒数第二页
                if (userDrag) {
                    //如果是用户拖拽到了最左边， 直接重置到倒数第二页
                    currentPage = this.state.count - 2;
                    this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: false});
                } else {
                    this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: true});
                    currentPage = this.state.count - 2;
                    this.timer2 = setTimeout(() => {
                        this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: false});
                    }, 600)
                }
            } else if (currentPage === this.state.count - 1) {
                //最右边，需要重置到第一页
                if (userDrag) {
                    currentPage = 1;
                    this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: false});
                } else {
                    this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: true});
                    currentPage = 1;
                    this.timer1 = setTimeout(() => {
                        this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: false});
                    }, 600)
                }
            } else {
                if (!userDrag) {
                    this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: true});
                }
            }
        } else {
            if (!userDrag) {
                this.scrollview.scrollTo({x: this.bannerWidth * currentPage, animated: true});
            }
        }
        this.setState({
            currentIndex: currentPage
        })
        this.handleCorrectIndex(currentPage);
    }

    handleCorrectIndex(index) {
        let currentIndex = index;
        if (this.state.count > 1 && this.props.autoScroll) {
            if (currentIndex === 0) {
                currentIndex = this.state.banner.length - 1;
            } else if (currentIndex === this.state.count - 1) {
                currentIndex = 0;
            } else {
                currentIndex = currentIndex - 1;
            }
        }
        this.props.bannerCurrentIndex && this.props.bannerCurrentIndex(currentIndex);
    }

    renderViewList() {
        let arrComp = [];
        let banner = this.state.banner;
        for (let index = 0; index < this.state.count; index++) {
            let item;
            let idx = 0;

            if (index === 0) {
                idx = this.props.autoScroll ? this.state.banner.length - 1 : index;
                item = banner[idx];
            } else if (index === this.state.count - 1) {
                idx = this.props.autoScroll ? 0 : index;
                item = banner[idx];
            } else {
                idx = this.props.autoScroll ? index - 1 : index;
                item = banner[idx];
            }
            arrComp.push(
                <TouchableOpacity
                    activeOpacity={1}
                    key={index}
                    onPress={() => {
                        this.props.bannerClick && this.props.bannerClick(idx);
                    }}
                >
                    {item}
                </TouchableOpacity>
            );
        }
        return arrComp;
    }

    render() {
        this.bannerWidth = this.props.style && this.props.style.width;//banner宽度
        this.bannerHeight = this.props.style && this.props.style.height;//banner高度
        if (!this.state.banner || this.state.banner.length === 0) {
            return null;
        }
        return (
            <View style={this.props.style}>
                <ScrollView
                    ref={(scrollview) => {
                        this.scrollview = scrollview
                    }}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    interceptHorizontalPop={true}//当前ScrollView可右滑时，不触发手势返回
                    interceptPop={true}//当前ScrollView不触发手势返回
                    pagingEnabled={true}
                    scrollEventThrottle={50}
                    onScrollBeginDrag={this.onScrollBeginDrag}
                    onScrollEndDrag={this.onScrollEndDrag}
                    onMomentumScrollEnd={this.onMomentumScrollEnd}
                    onContentSizeChange={() => {
                        if (this.isFirstInit) {
                            this.isFirstInit = false;
                            this.scrollview && this.scrollview.scrollTo({
                                x: this.bannerWidth * this.state.currentIndex,
                                animated: false
                            });
                        }
                    }}
                >
                    {this.renderViewList()}
                </ScrollView>
            </View>
        )
    }
}