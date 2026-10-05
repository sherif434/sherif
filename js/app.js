(function(){
    const yearElement=document.getElementById("year");
    if(yearElement) yearElement.textContent=new Date().getFullYear();

    const dateInput=document.getElementById("date");
    if(dateInput){
        const today=new Date();
        const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
        dateInput.min=localDate;
    }

    const bookingForm=document.getElementById("bookingForm");
    const submitButton=document.getElementById("bookingSubmit");

    if(bookingForm){
        bookingForm.addEventListener("submit",function(event){
            event.preventDefault();

            const name=document.getElementById("name").value.trim();
            const phone=document.getElementById("phone").value.trim();
            const service=document.getElementById("service").value;
            const date=document.getElementById("date").value;
            const notes=document.getElementById("notes").value.trim();

            if(!name||!phone||!service||!date){
                alert("من فضلك كملي بيانات الحجز الأول.");
                return;
            }

            if(!/^01[0-2,5][0-9]{8}$/.test(phone.replace(/[\s-]/g,""))){
                alert("من فضلك اكتبي رقم موبايل مصري صحيح.");
                return;
            }

            const message=[
                "السلام عليكم، عايزة أحجز موعد في Peter Beauty Salon.",
                "",
                "الاسم: "+name,
                "رقم الموبايل: "+phone,
                "الخدمة: "+service,
                "التاريخ: "+date,
                "ملاحظات: "+(notes||"لا يوجد")
            ].join("\n");

            if(submitButton){
                submitButton.disabled=true;
                submitButton.textContent="جاري فتح واتساب...";
            }

            const whatsappUrl="https://wa.me/201005201369?text="+encodeURIComponent(message);
            window.open(whatsappUrl,"_blank","noopener,noreferrer");

            if(submitButton){
                setTimeout(function(){
                    submitButton.disabled=false;
                    submitButton.textContent="إرسال طلب الحجز";
                },1200);
            }
        });
    }
})();