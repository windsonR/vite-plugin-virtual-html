import {createApp} from 'vue'
import {createRouter,createWebHashHistory} from 'vue-router'
import demo from './demo.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: demo
        },
        {
            path: '/route1',
            component: ()=>import('./route/route1.vue')
        }
    ]
})
const app = createApp({})
app.use(router)
app.mount('#app')
