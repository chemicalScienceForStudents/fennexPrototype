const { createApp } = Vue

  createApp({
    data() {
      return {
        isMobile:/Mobile/.test(navigator.userAgent),
        titulationVariables:{
            initialVol:25,
            analyteConc:0.1,
            titrantConc:0.1,
            addedVol:1,
            totalVolAdded:50,
            analyteName:'HCl',
            titrantName:'NaOH',
            graphType:{
                lineGraph:false,
                scatterPlot:true
            }
        },
        baseNames:[
            { text: 'NaOH', value: 'NaOH' },
            { text: 'KOH', value: 'KOH' },
            { text: 'LiOH', value: 'LiOH' },
            { text: 'Ca(OH)2', value: 'Ca(OH)2' },
            { text: 'Ba(OH)2', value: 'Ba(OH)2' },
            { text: 'Sr(OH)2', value: 'Sr(OH)2' }
          ],
        acidNames: [
            { text: 'HCl', value: 'HCl' },
            { text: 'HBr', value: 'HBr' },
            { text: 'HI', value: 'HI' },
            { text: 'HNO3', value: 'HNO3' },
            { text: 'H2SO4', value: 'H2SO4' },
            { text: 'HClO4', value: 'HClO4' }
        ],
        dataSet:[],
        titrantNames:[],
        analyteNames:[],
        type:1 // strong acid with strong basis 
      }
    },
    mounted(){
        // Create a default graph
        this.createTitulation(this.type)

        // Rebuild graph in any resize
        window.addEventListener('resize', () => { 
            this.createGraph(this.dataSet)
        });

        // asign default values for tritans and analytes
        this.titrantNames=this.baseNames
        this.analyteNames=this.acidNames

    },
    methods:{
        /**
         * Display the clicked menu in mobile view
         * @param {String} type - Type of menu
         */
        showMenu(type){
            // Check the type menu and add or remove class to show menu
            type=="burger" ? ( navigationMenu.classList.toggle("show-menu"),settingsButton.classList.toggle("hide-button"))
                           :   settingsMenu.classList.toggle("show-menu");
            // Remove scroll in body in desktop, more estetic
            if (!this.isMobile) {
                body.classList.toggle("non-scroll")
            }
        },
        /**
         * Create a dataset (vol(ml),pH) for a titulation of strong acid and strong basis and call createGraph function
         * @param {Int} type - Type of titulation 0 is of strong acid with strong basis and 0 is for inverse case
         */
        createTitulation(type) {

            // Select type of titulation 
            if (type == 0) {
                this.titrantNames = this.baseNames 
                this.analyteNames = this.acidNames 
                this.titulationVariables.analyteName = 'HCl'
                this.titulationVariables.titrantName = 'NaOH'
            }else{
                this.titrantNames = this.acidNames
                this.analyteNames = this.baseNames
                this.titulationVariables.analyteName
                this.titulationVariables.analyteName = 'NaOH'
                this.titulationVariables.titrantName = 'HCl'
            }

            // Delete previus dataset
            this.dataSet = []
            // Get initial concentration of analyte
            let analyteConc = this.titulationVariables.analyteConc
            // Get initial concentration of tritrant
            let titrantConc = this.titulationVariables.titrantConc
            // Get initial volume of analyte
            let initialVol = this.titulationVariables.initialVol
            // Get added volume of tritant
            let addedVol = this.titulationVariables.addedVol
            // Get total volume added
            let totalVolAdded = this.titulationVariables.totalVolAdded

            // Get initial moles of analyte (mol)
            let initialMolesAnalyte = initialVol*(1/1000)*(analyteConc)
            
            // Get volumen in equivalence point (ml)
            let equivalencePointVolume = initialMolesAnalyte*(1/titrantConc)*(1000/1)
            
            // Get maximum number of points with double volumen equivalence 
            //let maxNumberPoints = (equivalencePointVolume*2)/addedVol
            
            // Get maximum number of points with total volume added (infinity points)
            let maxNumberPoints2 = (totalVolAdded)/addedVol       

            // Define array for tritant volume addition and pH value 
            let volumeTritant=[]
            let pH=[]
            
            for (let i = 0; i <= parseInt(maxNumberPoints2); i++) {
                // Get addded tritant volume
                let volumeAdded = addedVol*i
                // Add adition in array 
                volumeTritant[i]=parseFloat(volumeAdded .toFixed(2))
                // Get moles of tritrant added 
                let molesTritant = volumeAdded*(1/1000)*titrantConc
                // Get total volumen (L)
                let volumeTotal= (initialVol+volumeAdded)*(1/1000)
                // Make a condition in base of difference of moles
                let differenceMoles=initialMolesAnalyte-molesTritant
                // Get a proton concentration 
                let protonConc = Math.abs(differenceMoles)/volumeTotal

                // Get current pH
                let currentpH=0
                if (type==0) {
                    // Strong acid as analyte and basis as tritant 
                    currentpH = differenceMoles > 0 ? -Math.log10(protonConc) 
                                  : differenceMoles == 0 ? 7 
                                  : 14+Math.log10(protonConc)
                }else{
                    // Strong basis as analyte and acid as tritant 
                    currentpH = differenceMoles > 0 ? 14+Math.log10(protonConc)
                                  : differenceMoles == 0 ? 7 
                                  : -Math.log10(protonConc)
                }

                // Define accuracy and save current pH into pH array
                pH[i]=parseFloat(currentpH.toFixed(2))
                // Save graph information globally 
                this.dataSet[i]=[volumeTritant[i],pH[i]]
            }
            //Create graph    
            this.createGraph(this.dataSet)

        },
        /**
         * Create a scatter plot with dataset values 
         * @param {Array} dataSet - [tritantVolume,pHValues]
         */
        createGraph(dataSet){

            // check if graph exist and delete it if exist
            if (graph.children.length != 0) {
                graph.innerHTML=''
            }

            // Get width and height of graph element 
            let width = graph.offsetWidth
            let height = graph.offsetHeight
            let padding = 60

            // Create a svg element inside graph element
            const svg = d3.select('#graph')
                           .append("svg")
                           .attr("width",width)
                           .attr("height",height)
            // Define x scale for volumen 
            const xScale = d3.scaleLinear()
                             .domain([0,d3.max(dataSet,d=>d[0])])
                             .range([padding, width - padding/2]);
            // Define y scale for pH 
            const yScale = d3.scaleLinear()
                             .domain([0,14])
                             .range([height - padding,padding]);

            // Create axis
            const xAxis = d3.axisBottom(xScale).tickFormat(d3.format(".1f"))
            const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".1f"))
            // Create grid
            const xAxisGrid = d3.axisBottom(xScale).tickSize(-height+2*padding).tickFormat('')
            const yAxisGrid = d3.axisLeft(yScale).tickSize(-width+padding*1.5).tickFormat('')


            // Insert data into graph 
            svg.selectAll("circle")
               .data(dataSet)
               .enter()
               .append("circle")
               .attr("class",d=> d[1]!=7 ? "graph-dot" : "graph-dot-2")
               .attr("cx",d => xScale(d[0]))  
               .attr("cy",d => yScale(d[1]))
               .attr("r", 5)
               .attr("data-vol",d => (d[0]))
               .attr("data-pH",d => (d[1]))
               .on("mouseover",e=>{
                    let vol = e.target.getAttribute("data-vol")
                    let pH = e.target.getAttribute("data-pH")
                    tooltip.style.display= "block"
                    tooltip.children[0].textContent = `pH: ${pH}`
                    tooltip.children[2].textContent = `Vol.: ${vol} mL`
                    tooltip.style.left = `${e.clientX+15}px`
                    tooltip.style.top = `${e.clientY}px`   
                })
                .on("mouseout", ()=>{
                    tooltip.style.display= "none"
                })

            // Add x axis
            svg.append("g")
                .attr("class","axis-g")
                .attr("id","x-axis")
                .attr("transform", "translate(0," + (height - padding) + ")")
                .call(xAxis);

            // Add y axis
            svg.append("g")
                .attr("class","axis-g")
               .attr("id","y-axis")
               .attr("transform", "translate(" + padding + ",0)")
              .call(yAxis);

            // Create grids
            svg.append('g')
            .attr('class', 'axis-grid')
            .attr('transform', `translate(0,${height-padding})`)
            .call(xAxisGrid);

            svg.append('g')
            .attr('class', 'axis-grid')
            .attr('transform', `translate(${padding},0)`)
            .call(yAxisGrid);

            // Define title with analyte and tritant and its concentrations
            let title = `Titulación de ${this.titulationVariables.analyteName} ${this.titulationVariables.analyteConc} M con ${this.titulationVariables.titrantName} ${this.titulationVariables.titrantConc} M`

            // Add a title
            svg.append("text")
               .attr("id","title")
               .attr("class", "graph-title")
               .attr("text-anchor", "middle")
               .attr("y", padding/3)
               .attr("x", width/2)
               .attr("dy", ".75em")
               .text(title);

            // Define x axis label with tritant name and its concentrations
            let label = `Volumen de ${this.titulationVariables.titrantName} agregado (mL)`

            // Add a x axis
            svg.append("text")
               .attr("text-anchor", "middle")
               .attr("class", "axis-label")
               .attr("x", width/2)
               .attr("y", height - padding/3)
               .text(label);  

            // Add a y axis
            svg.append("text")
               .attr("class", "axis-label")
               .attr("text-anchor", "end")
               .attr("y", height/2 - 7)
               .attr("x", padding/2)
               .attr("dy", ".75em")
               .text("pH");
        },
        changeInputValue(status){
            // update graph
            status == 0 ? this.createTitulation(this.type) : this.createGraph(this.dataSet)
        }

    }
  }).mount('#app')