import {createElement} from 'react';
import dynamic from 'dva/dynamic';
import pathToRegexp from 'path-to-regexp';
import {getMenuData} from './menu';

let routerDataCache;

const modelNotExisted = (app, model) => {
  return !app
    ._models
    .some(({namespace}) => {
      return namespace === model.substring(model.lastIndexOf('/') + 1);
    })
}

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
  // () => require('module') transformed by babel-plugin-dynamic-import-node-sync
  if (component.toString().indexOf('.then(') < 0) {
    models.forEach((model) => {
      if (modelNotExisted(app, model)) {
        // eslint-disable-next-line
        app.model(require(`../models/${model}`).default);
      }
    });
    return (props) => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return createElement(component().default, {
        ...props,
        routerData: routerDataCache
      });
    };
  }
  // () => import('module')
  return dynamic({
    app,
    models: () => models
      .filter(model => modelNotExisted(app, model))
      .map(m => import (`../models/${m}.js`)),
    // add routerData prop
    component: () => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return component().then((raw) => {
        const Component = raw.default || raw;
        return props => createElement(Component, {
          ...props,
          routerData: routerDataCache
        });
      });
    }
  });
};

function getFlatMenuData(menus) {
  let keys = {};
  menus.forEach((item) => {
    if (item.children) {
      keys[item.path] = {
        ...item
      };
      keys = {
        ...keys,
        ...getFlatMenuData(item.children)
      };
    } else {
      keys[item.path] = {
        ...item
      };
    }
  });
  return keys;
}

export const getRouterData = (app) => {
  const routerConfig = {
    '/': {
      component: dynamicWrapper(app, [
        'user', 'appControl', 'createApp', 'teamControl', 'plugin'
      ], () => import ('../layouts/BasicLayout'))
    },
    '/team/:team/region/:region/source': {
      component: dynamicWrapper(app, ['index'], () => import ('../routes/Source/Index'))
    },
    '/team/:team/region/:region/finance': {
      component: dynamicWrapper(app, ['index'], () => import ('../routes/Finance/index'))
    },
    '/team/:team/region/:region/index': {
      component: dynamicWrapper(app, ['index'], () => import ('../routes/Index/Index'))
    },
    '/team/:team/region/:region/team': {
      component: dynamicWrapper(app, ['teamControl'], () => import ('../routes/Team/index'))
    },
    '/team/:team/region/:region/groups/:groupId': {
      component: dynamicWrapper(app, ['groupControl'], () => import ('../routes/Group/Index'))
    },
    '/team/:team/region/:region/groups/share/one/:groupId/:shareId': {
      component: dynamicWrapper(app, ['groupControl'], () => import ('../routes/Group/AppShare'))
    },
    '/team/:team/region/:region/groups/share/two/:groupId/:shareId': {
      component: dynamicWrapper(app, ['groupControl'], () => import ('../routes/Group/AppShareLoading'))
    },
    '/team/:team/region/:region/groups/share/three/:groupId:ShareId': {
      component: dynamicWrapper(app, ['groupControl'], () => import ('../routes/Group/AppShareFinish'))
    },
    '/team/:team/region/:region/app/:appAlias/:type?': {
      component: dynamicWrapper(app, [
        'appDetail', 'appControl'
      ], () => import ('../routes/App/index'))
    },
    '/team/:team/region/:region/create/code/:type?': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/code'))
    },
    '/team/:team/region/:region/create/market': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/market'))
    },
    '/team/:team/region/:region/myplugns/:pluginId?': {
      component: dynamicWrapper(app, [], () => import ('../routes/Plugin/index'))
    },
    '/team/:team/region/:region/create-plugin': {
      component: dynamicWrapper(app, [], () => import ('../routes/Plugin/Create'))
    },
    '/team/:team/region/:region/create/create-check/:appAlias': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/create-check'))
    },
    '/team/:team/region/:region/create/create-compose-check/:groupId/:composeId': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/create-compose-check'))
    },
    '/team/:team/region/:region/create/image/:type?': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/image')),
      name: ''
    },
    '/team/:team/region/:region/create/create-setting/:appAlias': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/create-setting'))
    },
    '/team/:team/region/:region/create/create-compose-setting/:groupId/:composeId': {
      component: dynamicWrapper(app, [], () => import ('../routes/Create/create-compose-setting'))
    },
    '/team/:team/region/:region/result/success': {
      component: dynamicWrapper(app, [], () => import ('../routes/Result/Success'))
    },
    '/result/fail': {
      component: dynamicWrapper(app, [], () => import ('../routes/Result/Error'))
    },
    '/team/:team/region/:region/exception/403': {
      component: dynamicWrapper(app, [], () => import ('../routes/Exception/403'))
    },
    '/team/:team/region/:region/exception/404': {
      component: dynamicWrapper(app, [], () => import ('../routes/Exception/404'))
    },
    '/team/:team/region/:region/exception/500': {
      component: dynamicWrapper(app, [], () => import ('../routes/Exception/500'))
    },
    '/exception/trigger': {
      component: dynamicWrapper(app, ['error'], () => import ('../routes/Exception/triggerException'))
    },
    '/user': {
      component: dynamicWrapper(app, ['user'], () => import ('../layouts/UserLayout'))
    },
    '/user/login': {
      component: dynamicWrapper(app, ['user'], () => import ('../routes/User/Login')),
      name: '登录'
    },
    '/user/register': {
      component: dynamicWrapper(app, ['user'], () => import ('../routes/User/Register')),
      name: '注册'
    },
    '/user/register-result': {
      component: dynamicWrapper(app, [], () => import ('../routes/User/RegisterResult'))
    },
    // '/user/:id': {   component: dynamicWrapper(app, [], () =>
    // import('../routes/User/SomeComponent')), },
  };
  // Get name from ./menu.js or just set it in the router data.
  const menuData = getFlatMenuData(getMenuData());

  // Route configuration data eg. {name,authority ...routerConfig }
  const routerData = {};
  // The route matches the menu
  Object
    .keys(routerConfig)
    .forEach((path) => {
      // Regular match item name eg.  router /user/:id === /user/chen
      const pathRegexp = pathToRegexp(path);
      const menuKey = Object
        .keys(menuData)
        .find(key => pathRegexp.test(`/${key}`));
      let menuItem = {};
      // If menuKey is not empty
      if (menuKey) {
        menuItem = menuData[menuKey];
      }
      let router = routerConfig[path];
      // If you need to configure complex parameter routing,
      // https://github.com/ant-design/ant-design-pro-site/blob/master/docs/router-and
      // -
      // nav.md#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E8%B7%AF%E7%94%B1%E8%8F%9C%E5%8D%
      // 9 5 eg . /list/:type/user/info/:id
      router = {
        ...router,
        name: router.name || menuItem.name,
        authority: router.authority || menuItem.authority
      };
      routerData[path] = router;
    });
  return routerData;
};
