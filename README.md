# Empresa Front
    
    CREATE DATABASE empresa CHARACTER SET utf8 COLLATE utf8_general_ci;


        1 - 
            composer install        
        2 - 
            cp .env.example .env
            talvez seja necessario mudar o nome da database para empresa
        3 - 
            php artisan key:generate
        4 - 
            php artisan jwt:secret
        5 - 
            php artisan cache:clear
        6 - 
            php artisan config:clear
        7 - 
            php artisan migrate
        8 - 
            php artisan serve --host=10.0.0.164 --port=5000  

        9 - 
            composer dump-autoload