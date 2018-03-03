Vue.prototype.$eventHub = new Vue();

const _DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Vue.component('setDay', {
    props: ['days'],
    data: function() {
        return {
            'selectedDay': 'Set day'
        }
    },
    computed: {
        cleanDays: function() {
            var res = []
            var daysSet = new Set(this.days)
            for (var i = 0; i < _DAYS.length; i++) {
                if (daysSet.has(_DAYS[i]))
                    res.push(_DAYS[i].slice(0, 3));
            }
            return res;
        }
    },
    template: `<div class="dropdown">
                  <button class="btn dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {{selectedDay}}
                  </button>
                  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    <a @click="select(day)" v-for="day in cleanDays" class="dropdown-item" href="#">{{day}}</a>
                  </div>
                </div>`,
    methods: {
        select: function(day) {
            this.selectedDay = day
            this.$eventHub.$emit('dirtyDay');
        }
    }
})

Vue.component('customer-item', {
    props: ['customer'],
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
                            <th scope="col">
                                <button type="button" class="btn btn-primary" v-if="dirtyDay">Submit pickup days</button>
                                <span v-else>Pickup Day</span>
                            </th>
                            <th scope="col">Confirmed</th>
                        </tr>
                    </thead>
                    <tbody>
                        <customer-item v-for="customer in customers" v-bind:customer="customer">
                        </customer-item>
                    </tbody>
                </table></div>`,
    data: function() {
        return {
            'customers': [],
            'dirtyDay': false
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

        // Check whether days have been selected to be submitted. If so, make the submit button appear to confirm.
        this.$eventHub.$on('dirtyDay', function() {
            this.dirtyDay = true
        }.bind(this));
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<customers/>'
})