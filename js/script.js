let urls;
let progress = 0;
let responseCount = 0;
let doneUrls = 0;
let failedUrls = 0;
let inbackupProgress = 0;

const pause = ms => new Promise(res => setTimeout(res, ms))

// Backup single url
async function backupUrls(urls) {
  for (let i = 0; i < urls.length; ++i) {
    inbackupProgress++
    document.getElementById(urls[i].loc).remove();
    $("#inbackupProgress").removeClass("d-none");
    $("#inbackupProgress-list").append('<li id="' + urls[i].loc + '" class="list-group-item list-group-item-info"><img height="20px" src="img/oval.svg"> '+ urls[i].loc +'</li>');
    $("#progress").removeClass("d-none");
    $("#progressbar").attr('style','width:'+ progress + '%').html(progress + '%'); 
    $("#queue-stats").empty().append('<h3 class="text-warning mr-2">In Wartezeit: '+ (urls.length - (i+1)) +'</h3>');
    $("#inbackupProgress-stats").empty().append('<h3 class="text-info mr-2">In SicherungProzzes: '+ inbackupProgress +'</h3>');
    $("#done-stats").empty().append('<h3 class="text-success mr-2">Done: '+ doneUrls +'</h3>');
    $("#failed-stats").empty().append('<h3 class="text-danger mr-2">Failed: '+ failedUrls +'</h3>');
  
    /* 
      Mit einer Pause von 0.3sec Archive.org return "Too Many Requests"
      um dies zu vermeiden, ersetzen (Linie: 43 + 44):

       await pause(3000);
       axios.post("api/server.php", { url: urls[i].loc })

       durch:

       await axios.post("api/server.php", { url: urls[i].loc })

      somit wird die nächste Anfrage gesendet, nachdem die Antwort
      auf die vorläufige Anfrage erhalten wurde

    */

    // Pause in Millisekunden einstellen
    await pause(300);
    axios.post("api/server.php", { singleurl: urls[i].loc })
    .then(function(response){
      responseCount++;
      inbackupProgress--;
      progress = Math.round((responseCount/urls.length) * 100);

      document.getElementById(urls[i].loc).remove();
      $("#success").removeClass("d-none");
      console.log(response)
      if(response.data == "302"){
        doneUrls++
        $("#success-list").append('<li id="' + urls[i].loc + '" class="list-group-item list-group-item-success"><img height="20px" src="img/done.png"> '+ urls[i].loc +'</li>');
      } else {
        failedUrls++
        $("#success-list").append('<li id="' + urls[i].loc + '" class="list-group-item list-group-item-danger"><img height="20px" src="img/red-x.png"> '+ urls[i].loc +'</li>');
      }
      
      $("#progressbar").attr('style','width:'+ progress + '%').html(progress + '%');   
      $("#inbackupProgress-stats").empty().append('<h3 class="text-info mr-2">In SicherungProzzes: '+ inbackupProgress +'</h3>');
      $("#done-stats").empty().append('<h3 class="text-success mr-2">Done: '+ doneUrls +'</h3>');
      $("#failed-stats").empty().append('<h3 class="text-danger mr-2">Failed: '+ failedUrls +'</h3>');
    
      if(progress == 100){
        $("#inbackupProgress").addClass("d-none");
        $("#url").attr('disabled', false);
        $("#url").val('');
        $("#backupBtn").attr('disabled', false);
      }
    })
  }

  $("#queue-box").addClass("d-none");
}


$("#form").submit(function (e) {
  e.preventDefault(); 

  let form = $(this);
  let actionUrl = form.attr("action");
  let url = $("#url").val();

  $("#url").attr('disabled', true)
  $("#backupBtn").attr('disabled', true)
  $("#404error").empty()
  axios
    .post(actionUrl, {
      url: url,
    })
    .then(function (response) {

      if(response.data == 404){
        $("#404error").empty().append('<h3 class="text-danger mr-2">Homepage oder Sitemap nicht gefunden</h3>');
        $("#url").attr('disabled', false);
        $("#url").val('');
        $("#backupBtn").attr('disabled', false);
      } else {

        $("#queue-box").removeClass("d-none");
        urls = response.data.url;
        response.data.url.forEach((url) => {
          $("#queue-list").append(
            '<li id="' +
              url.loc +
              '" class="list-group-item list-group-item-warning"> <img src="img/oval.svg" alt="">  ' +
              url.loc +
              "</li>"
          );
        });
      }
     
    })
    .finally(() => backupUrls(urls));
});


