import React, {PureComponent} from 'react';
import {connect} from 'dva';
import {Link, Switch, Route, routerRedux} from 'dva/router';
import {
	Row,
	Col,
	Card,
	Form,
	Button,
	Icon,
	notification,
	Modal,
	Upload
} from 'antd';
import globalUtil from '../../utils/global';
import config from '../../config/config';
import cookie from '../../utils/cookie';

const token = cookie.get('token');
let myheaders = {}
if (token) {
   myheaders.Authorization = `GRJWT ${token}`;  
   myheaders['X_REGION_NAME'] = globalUtil.getCurrRegionName();
   myheaders['X_TEAM_NAME'] = globalUtil.getCurrTeamName();
}

// @connect(({user, global}) => ({currUser: user.currentUser}))

@connect(({user,global,groupControl}) => ({groupDetail: groupControl.groupDetail || {},currUser: user.currentUser,groups: global.groups || []}))
export default class Index extends PureComponent {
    constructor(props){
      super(props);
      this.state={
        fileList: []
      }
    }
   
    onChange = (info) => {
      let fileList = info.fileList;
      fileList = fileList.filter((file) => {
        if (file.response) {
          return file.response.msg === 'success';
        }
        return true;
      });
  
      this.setState({ fileList },()=>{
        const file = this.state.fileList
        if(file.length > 0){
          console.log(file[0])
          console.log(file[0].response)
          if(file[0].status == 'done'){
            this.props.onReLoad && this.props.onReLoad();
          }else{
            console.log("111111")
          }
        }
      });
    }
	onRemove =()=>{
    notification.info({
      message: '备份已导入',
      duration:'2'
    });
		return false
	}
  onData = (e)=>{
     console.log(e)
  }
    render(){
	  const group_id = this.props.groupId;
      const team_name = globalUtil.getCurrTeamName();
	  const uploadUrl = config.baseUrl + '/console/teams/'+ team_name +'/groupapp/'+ group_id +'/backup/import';
      const fileList = this.state.fileList;
      
      return (
         <Modal
           visible={true}
           onCancel={this.props.onCancel}
           title="请导入备份"
		   footer={
			[<Button key="back" onClick={this.props.onCancel}>关闭</Button>]
			}
         >
            <Upload 
               action={uploadUrl}
               fileList={fileList}
               onChange={this.onChange}
			        headers = {myheaders}
              onRemove ={this.onRemove}
              data={this.onData}
            >
                
                {fileList.length > 0? null: <Button>请选择文件</Button>}
            </Upload>
         </Modal>
      )
    }
}