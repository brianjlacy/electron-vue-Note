<template>
  <div class="noteItemCon" ref="noteItemCon" style="position: relative">
    <div class="tool">
      <div class="showMenu">
        <span style="padding-left: 10px">共{{count}}条</span>
        <span class="noteMe" :title="cataLogInfo.name">{{cataLogInfo.name}}</span>
        <span>正在显示{{itemList.length}}条</span>
      <p>
        <transition name="style1">
          <button v-show="isShowDele" class="button buttonDel" @click="deleteNote">删除选中笔记</button>
        </transition>
        <transition>
         <button v-show="isShowRecl" class="button buttonRecy" @click="deleteNote">将选中笔记移入回收站</button>
        </transition>
      </p>
      </div>
    </div>
    <div ref="noteListCon" class="noteListCon" >
      <scroll-page v-if="itemList.length !== 0" :isLoad="isLoad" :isGettingData="isGetPage" @scrollGetData="getNewData" style="height: 100%">
        <div slot="scrollContent">
          <note-item slot="item" v-for="item in itemList" :firstUuid="itemList[0].uuid" :item="item" :key="item.uuid"></note-item>
        </div>
      </scroll-page>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import util from '../../common/util'
  import log from '../../foundation/log'
  import noteItem from './noteItem.vue'
  import scrollPage from '../common/scrollPage.vue'
  import search from '../../business/search'
  import {mapGetters} from 'vuex'
  import cataLogOperatore from '../../business/cataLogOperatore'
  import noteOperatore from '../../business/noteOperatore'  
  
  var cataLogType = require('../../model/enumtype').cataLogType

  export default {
    components: {
      noteItem,
      scrollPage
    },
    data () {
      return {
        query: '',
        count: 0,
        isLoad: false,
        isGetData: false,
        isGetPage: false,
        firstUuid: '',
        delArr: [],
        cataLogInfo: {},
        pageIndex: 0,
        pageSize: 10,
        quikDirType: '',
        reclArr: [],
        isChangItem: false,
        isShowDele: false,
        lastSelectItemDom: null,
        isShowRecl: false,
        itemList: [],
        searchInfo: {}
      }
    },
    mounted () {
      this.$nextTick(() => {
        this.cataLogId = this.currentSelectCatalogItem.uuid
      })
    },
     computed: {
      ...mapGetters([
        'currentSelectCatalogItem',
      ])
    },
    watch: {
      'currentSelectCatalogItem': function (val) {
        this.cataLogId = val.uuid
        this.pageIndex = 0
        this.getNodeList(true)
      }
    },
    methods: {
      deleteNote () {
        
      },
      changSelectStyle () {
        if (this.itemList.length !== 0) {
          if (this.lastSelectItemDom) {
            this.lastSelectItemDom.setAttribute('style', '')
          }
          this.$nextTick(() => {
            let nodeItemDom = this.$refs.noteItemCon
            if (noteItem && nodeItemDom) {
              let dom = nodeItemDom.querySelector('.noteItem')
              if (dom) {
                dom.setAttribute('style', 'background:#E6E6E6;')
                this.lastSelectItemDom = dom
              }
            }
          })
        }
      },
      filter (keywords) {
        if (this.cataLogId) {
          search.searchNodeList(this.cataLogId, keywords).then(res => {
            for (let i = 0; i < res.length; i++) {
              res[i].title = util.tagColor(res[i].title, keywords)
              res[i].abstracts = util.tagColor(res[i].abstracts, keywords)
            }
            this.itemList = res
            this.router()
          }).catch(err => {
            console.log(err)
            log.writeErr(err)
          })
        }
      },
      getNewData () {
        this.pageIndex++
        this.getNodeList()
      },
      loading (res) {
        this.isGetPage = false
        if (res.length !== 0) {
          if (this.pageIndex === 0) {
            this.itemList.push(...res)
          } else if (this.pageIndex > 0) {
            this.isLoad = true
            setTimeout(() => {
              this.itemList.push(...res)
              this.isLoad = false
            }, 100)
          }
        } else {
          this.isLoad = false
          if (this.pageIndex > 0) {
            this.pageIndex = this.pageIndex - 1
          }
        }
      },
      getNodeList (isReload) {
        if (this.isGetData) {
          return
        }
        this.isGetData = true
        if (isReload) {
          this.itemList = []
        }
        let cataLogId = this.cataLogId
        let queryParam = this.searchInfo.query
        if (cataLogId === cataLogType.personalNote) {
          cataLogId = ''
        }
        cataLogOperatore.getOneCataLogInfo(this.cataLogId).then(rs => {
          if (rs) {
            this.cataLogInfo = rs
          } else {
            this.cataLogInfo = {
              name: '[全部目录]'
            }
          }
        })
        noteOperatore.getByCatalogId(cataLogId, cataLogType.personalNote, queryParam, this.pageIndex, this.pageSize).then(res => {
          this.loading(res.nodes)
          this.isGetData = false
          this.count = res.totalCount
          if (isReload) {
            this.changSelectStyle()
            this.router()
          }
        }).catch(err => {
          this.isGetData = false
          console.log(err)
          log.writeErr(err)
        })
      },
      router () {
        if (this.itemList && this.itemList.length) {
          let item = this.itemList[0]
          this.$router.push({name: 'nodeDetail', params: {uuid: item.uuid, isEditor: true}})
        }
        this.$emit('setCurrentList', this.itemList)
      },
    }
  }
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import '../../assets/scss/common.scss';
  .noteItemCon {
    display: -webkit-flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    text-align: left;
    border-right: 1px solid #ccc;
    box-sizing: border-box;
    overflow: hidden;
  }
 .noteItemCon .tool{
   padding: 2px 4px 3px 4px;
    margin: 5px 0 0 0;
   user-select: none;
    border-bottom: 1px solid #ccc;
  }
  .deleteCon {
    position:absolute;
    top:40%;
    left:40px;
    z-index:20;
    display: block;
    width:50px;
    text-align: center;
    .icon1{
      font-size:45px;
      color: rgba(0, 0, 0, .4);
      &:last-child {
        font-size:40px;
      }
      &:hover{
        color:rgba(0, 0, 0, .6);
      }
    }
    .del{
      position:relative;
      &:hover{
        .delinfo {
          display: block;
        }
      }
    }
    .delinfo{
     position: absolute;
      left: 50px;
      top:12px;
      display: none;
      width:130px;
      padding:5px;
      color:#fff;
      background:rgba(0, 0, 0, .6) ;
    }
  }
  .topBox{
    position: relative;
    width: 100%;
    height:31px;
    line-height:27px;
    .search{
      position: relative;
      float:left;
      width:250px;
      height:28px;
      padding:0 5px;
      border:1px solid #999;
      background:#fff;
      text-align: left;
      border-radius: 5px;
      input{
        width:180px;
        height:23px;
        line-height:23px;
      }
      i{
        position: absolute;
        width:15px;
        right:5px;
        line-height:31px;
      }
    }
    .sort{
      float:right;
      height: 28px;
      box-sizing: border-box;
      padding-top: 2px;
      i{
        font-size: 20px;
        color:rgba(0,0,0,0.3);
        cursor:pointer;
        &:hover{
          color:#a18270
        }
        &:active{
          color:#a18270
        }
      }
      ul{
        position:absolute;
        right:0px;
        top:32px;
        z-index:101;
        display: none;
        padding:1px;
        text-align:left;
        border:1px solid #DBDBDD;
        box-shadow:4px 4px 2px -2px rgba(0, 0, 0, 0.4);
        background: #fff;
        li{
          a{
            display:block;
            padding:2px 10px;
            font-size:12px;
          }
          &:hover {
            background: $mainBackColor;
          }
          &:active {
            background: $mainBackColor;
          }
        }
      }
    }
  }
  .showMenu{
    margin: 8px 0 5px;
    font-size:13px;
    color:#000000;
    user-select: none;
    overflow: hidden;
    span{
      display: block;
      float: left;
      height:18px;
      line-height:18px;
    }
  }
  .showDel{
    height:25px;
    line-height: 25px;
  }
  .noteMe{
    width:75px;
    padding: 0 3px;
    margin:0 3px ;
    border:1px solid rgba(0,0,0,0.5);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .noteItemCon ::-webkit-input-placeholder {
    font-style:italic;
    font-size:11px;
    color:#333;
  }
  .selectStyle{
    background-color:rgba(132,160,123,0.1);
    border:none;
    box-shadow: 2px 2px 2px #ccc;
  }
  .showSort{
    display:block !important;
  }
  .noteListCon{
    flex: 1;
    height: calc(100% - 70px);
  }
  @keyframes rotate{
    0%{
      transform:rotate(0deg);
    }
    100%{
      transform:rotate(180deg);
    }
  }

</style>
