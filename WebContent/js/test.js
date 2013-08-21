var obj = function(){
   var name = "juan";
   var age = 15;

   this.getAge = function(){
      return name;
   };
};


var a = new obj();
console.log(a.getAge());
