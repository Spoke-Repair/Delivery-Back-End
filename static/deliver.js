Vue.component('customer-item', {
    props: ['customer'],
    template: '<tr><td>{{customer.name}}</td><td>{{customer.confirmed}}</td></tr>'
})


Vue.component('customers', {
    template: '<div id="customers"><table class="u-full-width"><thead><tr><th>Name</th><th>Confirmed</th></tr></thead><tbody><customer-item v-for="customer in customers" v-bind:customer="customer"></customer-item></tbody></table></div>',
    data: function() {
        return {
            'customers': []
        }
    },
    mounted: function() {
        axios.get('/customer-data').then(function(res) {
            // console.log(res)
            this.customers = res.data.map(function(row) {
                return {
                    'name': row[0],
                    'confirmed': row[8] == 'Yes' ? true : false
                }
            })
        }.bind(this))
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<customers/>'
})