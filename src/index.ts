import { Collection } from "./collections/collection";
import { ECities, ECountry, TUser } from "./domain/types/user.type";

async function main() {
  const userCollection = new Collection<TUser>();

  const userLuis: TUser = {
    name: "Luis",
    description: "Joven",
    doc: "1122333",
    number: "+51 302 4958",
    createdAt: new Date("2091-02-25"),
    country: {
      name: ECountry.COL,
      city: ECities.CAL,
    },
    roles: ["System engineer", "Software engineer", "Software architect"],
  };

  const userJudith: TUser = {
    name: "Judith",
    description: "Adulto",
    doc: "33445566",
    number: "+51 301 4958",
    createdAt: new Date("2091-02-20"),
    country: {
      name: ECountry.COL,
      city: ECities.CAL,
    },
    roles: ["Techer"],
  };

  const userCelmira: TUser = {
    name: "Celmira",
    description: "Adulto",
    doc: "778899",
    number: "+51 301 4958",
    createdAt: new Date("2091-02-21"),
    country: {
      name: ECountry.COL,
      city: ECities.CAL,
    },
    roles: ["Accounter"],
  };

  await userCollection.insert(userLuis, userLuis.doc);
  await userCollection.insert(userJudith, userJudith.doc);
  await userCollection.insert(userCelmira, userCelmira.doc);

  const response = await userCollection.findById(userLuis.doc);
  console.log(response);
}

main();
