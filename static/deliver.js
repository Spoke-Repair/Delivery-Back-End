Vue.component('setDay', {
    props: ['days'],
    data: function() {
        return {
            'selectedDay': 'Set day'
        }
    },
    template: `<div class="dropdown">
                  <button class="btn dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {{selectedDay}}
                  </button>
                  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    <a @click="select(day)" v-for="day in days" class="dropdown-item" href="#">{{day}}</a>
                  </div>
                </div>`,
    methods: {
        select: function(day) {
            this.selectedDay = day
        }
    }
})

Vue.component('customer-item', {
    props: ['customer', 'showingName'],
    template: `<tr>
                <td>{{customer.name}}</td>
                <td><setDay v-bind:days="customer.days"/></td>
                <td>{{customer.confirmed}}</td>
               </tr>`
})


Vue.component('customers', {
    template: `<div id="customers">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Pickup Day</th>
                            <th scope="col">Confirmed</th>
                        </tr>
                    </thead>
                    <tbody>
                        <customer-item v-for="customer in customers" v-bind:showingName="showingName" v-bind:customer="customer">
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
                    'address': row[2],
                    'confirmed': row[8] == 'Yes' ? true : false,
                    'days': row[3].split(', ')
                }
            })
        }.bind(this))
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<customers/>'
})