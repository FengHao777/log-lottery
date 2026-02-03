import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import i18n from '@/locales/i18n'
import Home from '@/views/Home/index.vue'

export const configRoutes = {
    path: '/log-lottery/config',
    name: 'Config',
    component: () => import('@/views/Config/index.vue'),
    children: [
        {
            path: '',
            name: 'ConfigRedirect',
            redirect: '/log-lottery/config/person',
        },
        {
            path: '/log-lottery/config/person',
            name: 'PersonConfig',
            component: () => import('@/views/Config/Person/index.vue'),
            meta: {
                title: i18n.global.t('sidebar.personConfiguration'),
                icon: 'person',
            },
            children: [
                {
                    path: '',
                    name: 'PersonConfigRedirect',
                    redirect: '/log-lottery/config/person/all',
                },
                {
                    path: '/log-lottery/config/person/all',
                    name: 'AllPersonConfig',
                    component: () => import('@/views/Config/Person/PersonAll/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.personList'),
                        icon: 'all',
                    },
                },
                {
                    path: '/log-lottery/config/person/already',
                    name: 'AlreadyPerson',
                    component: () => import('@/views/Config/Person/PersonAlready/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.winnerList'),
                        icon: 'already',
                    },
                },
                // {
                //     path:'other',
                //     name:'OtherPersonConfig',
                //     component:()=>import('@/views/Config/Person/OtherPersonConfig.vue'),
                //     meta:{
                //         title:'其他配置',
                //         icon:'other'
                //     }
                // }
            ],
        },
        {
            path: '/log-lottery/config/prize',
            name: 'PrizeConfig',
            component: () => import('@/views/Config/Prize/PrizeConfig.vue'),
            meta: {
                title: i18n.global.t('sidebar.prizeConfiguration'),
                icon: 'prize',
            },
        },
        {
            path: '/log-lottery/config/global',
            name: 'GlobalConfig',
            redirect: '/log-lottery/config/global/all',
            meta: {
                title: i18n.global.t('sidebar.globalSetting'),
                icon: 'global',
            },
            children: [
                {
                    path: '/log-lottery/config/global/face',
                    name: 'FaceConfig',
                    component: () => import('@/views/Config/Global/FaceConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.viewSetting'),
                        icon: 'face',
                    },
                },
                {
                    path: '/log-lottery/config/global/image',
                    name: 'ImageConfig',
                    component: () => import('@/views/Config/Global/ImageConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.imagesManagement'),
                        icon: 'image',
                    },
                },
                {
                    path: '/log-lottery/config/global/music',
                    name: 'MusicConfig',
                    component: () => import('@/views/Config/Global/MusicConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.musicManagement'),
                        icon: 'music',
                    },
                },
            ],
        },
        {
            path: '/log-lottery/config/server',
            name: 'Server',
            component: () => import('@/views/Config/Server/index.vue'),
            meta: {
                hidden: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true',
                title: i18n.global.t('sidebar.server'),
                icon: 'server',
            },
        },
        {
            path: '/log-lottery/config/readme',
            name: 'Readme',
            component: () => import('@/views/Config/Readme/index.vue'),
            meta: {
                title: i18n.global.t('sidebar.operatingInstructions'),
                icon: 'readme',
            },
        },
        {
            path: '/log-lottery/config/department',
            name: 'Department',
            component: () => import('@/views/Config/Department/index.vue'),
            meta: {
                title: i18n.global.t('sidebar.departmentManagement'),
                icon: 'department',
            },
        },
    ],
}
const routes = [
    {
        path: '/',
        redirect: '/log-lottery',
    },
    {
        path: '/log-lottery',
        component: Layout,
        redirect: '/log-lottery/password',
        children: [
            {
                path: '/log-lottery/password',
                name: 'Password',
                component: () => import('@/views/Password/index.vue'),
            },
            {
                path: '/log-lottery/home',
                name: 'Home',
                component: Home,
            },
            {
                path: '/log-lottery/demo',
                name: 'Demo',
                component: () => import('@/views/Demo/index.vue'),
            },
            {
                path: '/log-lottery/mobile',
                name: 'Mobile',
                meta: {
                    isMobile: true,
                },
                component: () => import('@/views/Mobile/index.vue'),
            },
            {
                path: '/log-lottery/mobile/success',
                name: 'MobileSuccess',
                meta: {
                    isMobile: true,
                },
                component: () => import('@/views/Mobile/Success.vue'),
            },
            configRoutes,
        ],
    },
]
const envMode = import.meta.env.MODE
const router = createRouter({
    // 读取环境变量
    history: (envMode === 'file' || import.meta.env.TAURI_PLATFORM) ? createWebHashHistory() : createWebHistory(),
    routes,
})

function isMobileDevice() {
    const ua = navigator.userAgent
    const mobileKeywords = [
        'Mobile',
        'Android',
        'iPhone',
        'iPad',
        'iPod',
        'BlackBerry',
        'Windows Phone',
        'webOS',
        'Opera Mini',
        'IEMobile',
    ]

    const isMobileUA = mobileKeywords.some(keyword => ua.includes(keyword))
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const screenRatio = screenWidth / screenHeight
    const isPortrait = screenWidth < screenHeight
    const isSmallScreen = screenWidth <= 768

    return isMobileUA || (isSmallScreen && isPortrait) || (screenRatio < 0.6 && screenWidth < 1000)
}

router.beforeEach((to, from, next) => {
    const isPasswordVerified = sessionStorage.getItem('passwordVerified') === 'true'
    const isPasswordPage = to.path === '/log-lottery/password'
    const isMobilePage = to.path.startsWith('/log-lottery/mobile')

    if (isMobilePage) {
        next()
        return
    }

    if (isMobileDevice()) {
        next('/log-lottery/mobile')
        return
    }

    if (isPasswordPage) {
        if (isPasswordVerified) {
            next('/log-lottery/home')
        }
        else {
            next()
        }
        return
    }

    if (isPasswordVerified) {
        next()
        return
    }

    next('/log-lottery/password')
})

export default router
