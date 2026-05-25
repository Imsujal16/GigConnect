document.addEventListener("DOMContentLoaded", async ()=> {
 console.log("explorepopularservices.js loaded!");
 const servicesContainer=document.querySelector(".services-grid");
 if(!servicesContainer){
    console.warn("grid container not found")
    return;
 }
 try{
    const response=await fetch("assets/popularservices.json")
    if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);   
    }
    const servicesData= await response.json();
    servicesContainer.innerHTML=''
    servicesData.forEach(service => {
        const serviceCardHTML=`
       <div class="service-card">
                    <img src="${service.icon}" alt="${service.altText || service.name}">
                    <p>${service.name}</p>
                </div>
        `;
        servicesContainer.innerHTML+=serviceCardHTML;

        
    });

 }catch(error){
    console.error("error fetching or  parsing services data",error);
    servicesContainer.innerHTML+='<p class="error-message">Failed to load services data.Try later</p>'
 }
});