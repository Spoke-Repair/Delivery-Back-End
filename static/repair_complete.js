Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `<tr>
                <td>{{customer.name}}</td>
                <td>
                    <button type="button" class="btn btn-primary" v-if="customer.completed">Finish</button>
                    <button type="button" class="btn btn-primary" disabled v-else>Completed</button>
                </td>
               </tr>`
})


Vue.component('customers', {
    template: `<div id="customers">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Complete repair</th>
                        </tr>
                    </thead>
                    <tbody>
                        <customer-item v-for="customer in customers" v-bind:customer="customer">
                        </customer-item>
                    </tbody>
                </table></div>`,
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
                    'completed': row[9]
                }
            })
        }.bind(this))
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<customers/>'
})