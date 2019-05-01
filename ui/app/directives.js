//ADDED by MM 6.5.18
app3.factory('readFileData', function() {
   return {
       processData: function(csv_data, strDelimiter) {
         var lines = []; //old script
         var json = {}; //old
         strDelimiter = (strDelimiter || ",");
         var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );
            var arrData = [[]];
            var arrMatches = null;
            while (arrMatches = objPattern.exec( csv_data )){
           // Get the delimiter that was found.
           var strMatchedDelimiter = arrMatches[ 1 ];
           if (
               strMatchedDelimiter.length &&
               (strMatchedDelimiter != strDelimiter)
               ){
               arrData.push( [] );
           }
           if (arrMatches[ 2 ]){
               var strMatchedValue = arrMatches[ 2 ].replace(
                   new RegExp( "\"\"", "g" ),
                   "\""
                   );
           } else {
               var strMatchedValue = arrMatches[ 3 ];
           }
           arrData[ arrData.length - 1 ].push( strMatchedValue );

       }
       //added because of above
       arrData.length = (arrData.length - 1); // This is necessary because the above adds a line number which adds an extra line to the array.
       var arrayLength = arrData.length;
       //from old script
       for (var k = 0; k < arrData.length; ++k){
         json['line_'+k] = arrData[k];
        }

        return [json, arrayLength];
       }
     }


});
//END Added by MM

//ADDED by MM 3.25.19 aaronranard/input-max-length.js
// Limits the character input
app3.directive('inputMaxLength', function() {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      maxlength = parseInt(attrs.inputMaxLength, 10);
      function fromUser(text) {
          if (text.length > maxlength) {
            var transformedInput = text.substring(0, maxlength);
            ngModelCtrl.$setViewValue(transformedInput);
            ngModelCtrl.$render();
            return transformedInput;
          }
          return text;
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  };
});
//End Added by MM
