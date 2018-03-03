Vue.component('customer-item', {
    props: ['customer', 'showingName'],
    template: '<tr><td v-if="showingName">{{customer.name}}</td><td v-else>{{customer.address}}</td><td>{{customer.confirmed}}</td></tr>'
})


Vue.component('customers', {
    template: '<div id="customers"><table class="u-full-width"><thead><tr><th><a @click="showName" class="button">Name</a>  <a @click="showAddr" class="button">Address</a></th><th>Confirmed</th></tr></thead><tbody><customer-item v-for="customer in customers" v-bind:showingName="showingName" v-bind:customer="customer"></customer-item></tbody></table></div>',
    data: function() {
        return {
            'customers': [],
            'showingName': true
        }
    },
    mounted: function() {
        axios.get('/customer-data').then(function(res) {
            // console.log(res)
            this.customers = res.data.map(function(row) {
                return {
                    'name': row[0],
                    'address': row[2],
                    'confirmed': row[8] == 'Yes' ? true : false
                }
            })
        }.bind(this))
    },
    methods: {
        showName: function() {
            this.showingName = true
        },
        showAddr: function() {
            this.showingName = false
        }
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<customers/>'
})